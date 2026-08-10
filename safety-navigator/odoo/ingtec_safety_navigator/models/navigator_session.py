# -*- coding: utf-8 -*-
"""Navigator-Session – Spezifikation Abschnitt 9 und 10."""

import secrets
import string

from odoo import api, fields, models

# Verwechslungsarmes Alphabet: ohne 0/O und 1/I, damit Referenzen telefonisch
# und handschriftlich übertragbar bleiben.
REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
REFERENCE_LENGTH = 6


class NavigatorSession(models.Model):
    _name = "ingtec.navigator.session"
    _description = "INGTEC Safety Navigator Session"
    _inherit = ["mail.thread"]
    _order = "started_at desc"
    _rec_name = "reference"

    reference = fields.Char(
        string="Referenz",
        required=True,
        readonly=True,
        copy=False,
        index=True,
        default=lambda self: self._generate_reference(),
        help="Eindeutige Session-Referenz im Format SN-2026-X8F72P.",
    )
    state = fields.Selection(
        [
            ("draft", "Begonnen"),
            ("in_progress", "In Bearbeitung"),
            ("completed", "Abgeschlossen"),
            ("converted", "In Lead überführt"),
            ("abandoned", "Abgebrochen"),
        ],
        string="Status",
        default="draft",
        required=True,
        tracking=True,
    )
    website_id = fields.Many2one("website", string="Website")

    # Kontakt – erst ab dem Zeitpunkt befüllt, an dem der Nutzer
    # personenbezogene Daten bewusst angibt (Abschnitt 9).
    partner_id = fields.Many2one("res.partner", string="Kontakt")
    company_name = fields.Char(string="Unternehmen")
    contact_name = fields.Char(string="Ansprechperson")
    email = fields.Char(string="E-Mail")
    phone = fields.Char(string="Telefon")

    object_type_id = fields.Many2one("ingtec.navigator.object_type", string="Objektart")
    started_at = fields.Datetime(string="Begonnen am", default=fields.Datetime.now, readonly=True)
    completed_at = fields.Datetime(string="Abgeschlossen am", readonly=True)

    lead_id = fields.Many2one("crm.lead", string="Lead", readonly=True)
    quotation_id = fields.Many2one("sale.order", string="Angebot", readonly=True)
    score_id = fields.Char(
        string="Safety-Score(R)-Referenz",
        help="Referenz im Safety-Score(R) Core. Der Navigator berechnet selbst keinen Score.",
    )
    consent_status = fields.Selection(
        [
            ("none", "Keine Angabe"),
            ("anonymous", "Anonym"),
            ("granted", "Einwilligung erteilt"),
            ("withdrawn", "Einwilligung widerrufen"),
        ],
        string="Einwilligung",
        default="anonymous",
        required=True,
    )

    # Fachlicher Zustand
    instance_ids = fields.One2many(
        "ingtec.system.instance", "session_id", string="Erfasste Anlagen"
    )
    object_facts = fields.Json(
        string="Objektfakten",
        default=dict,
        help="Antworten auf Objektfragen; Schlüssel ohne Namensraum-Präfix.",
    )
    result_snapshot = fields.Json(
        string="Ergebnis",
        help="Eingefrorenes Ergebnis der Rule Engine zum Zeitpunkt des Abschlusses.",
    )
    attachment_ids = fields.Many2many("ir.attachment", string="Unterlagen")

    instance_count = fields.Integer(compute="_compute_instance_count", string="Anlagen")

    _sql_constraints = [
        ("reference_uniq", "unique(reference)", "Die Session-Referenz muss eindeutig sein."),
    ]

    @api.depends("instance_ids")
    def _compute_instance_count(self):
        for session in self:
            session.instance_count = len(session.instance_ids)

    @api.model
    def _generate_reference(self):
        """Erzeugt SN-<Jahr>-<6 Zeichen> und stellt Eindeutigkeit sicher."""
        year = fields.Date.context_today(self).year
        for _attempt in range(10):
            token = "".join(secrets.choice(REFERENCE_ALPHABET) for _ in range(REFERENCE_LENGTH))
            reference = f"SN-{year}-{token}"
            if not self.sudo().search_count([("reference", "=", reference)]):
                return reference
        # Äußerst unwahrscheinlich; dann mit längerem Token weitermachen.
        token = "".join(secrets.choice(REFERENCE_ALPHABET) for _ in range(REFERENCE_LENGTH + 4))
        return f"SN-{year}-{token}"

    def action_complete(self):
        self.write({"state": "completed", "completed_at": fields.Datetime.now()})

    def action_create_lead(self):
        """Überführt die Session in einen CRM-Lead (Abschnitt 4: Odoo bleibt
        betriebswirtschaftlicher Backbone)."""
        self.ensure_one()
        if self.lead_id:
            return self.lead_id

        lead = self.env["crm.lead"].create(
            {
                "name": f"Safety Navigator {self.reference}",
                "type": "opportunity",
                "partner_name": self.company_name,
                "contact_name": self.contact_name,
                "email_from": self.email,
                "phone": self.phone,
                "description": self._render_lead_description(),
                "navigator_session_id": self.id,
            }
        )
        self.write({"lead_id": lead.id, "state": "converted"})
        return lead

    def _render_lead_description(self):
        """Kurzfassung des Prüfbedarfs für den Vertrieb."""
        self.ensure_one()
        lines = [
            f"Safety Navigator Session: {self.reference}",
            f"Objektart: {self.object_type_id.name or '-'}",
            "",
            "Erfasste Anlagen:",
        ]
        for instance in self.instance_ids:
            location = f" ({instance.location})" if instance.location else ""
            count = f" x{instance.quantity}" if instance.quantity and instance.quantity > 1 else ""
            lines.append(f"  - {instance.system_type_id.name}{count}{location}")
        if not self.instance_ids:
            lines.append("  (keine)")
        return "\n".join(lines)

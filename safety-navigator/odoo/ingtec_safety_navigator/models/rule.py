# -*- coding: utf-8 -*-
"""Regelwerk – Spezifikation Abschnitt 23, 24 und 25.

Die Auswertung selbst erfolgt in der framework-unabhängigen Rule Engine
(``static/src/core/engine/rule-engine.js``). Dieses Modell hält die Regeln,
ihren Freigabestatus und ihre Versionierung. Damit bleibt nachvollziehbar,
welche Regelfassung ein Ergebnis erzeugt hat.
"""

from odoo import _, api, fields, models
from odoo.exceptions import UserError

# Abschnitt 25: Priorität 1 bindet am stärksten.
PRIORITY_BY_QUALITY = {
    "behoerdlich": "1",
    "gesetzlich": "2",
    "regelwerk": "3",
    "norm": "4",
    "hersteller": "5",
    "empfehlung": "6",
}


class Rule(models.Model):
    _name = "ingtec.rule"
    _description = "INGTEC Regel"
    _inherit = ["mail.thread"]
    _order = "priority, code"
    _rec_name = "code"

    code = fields.Char(string="Regel-ID", required=True, index=True, help="Beispiel: RULE-AMVO-GATE-001.")
    title = fields.Char(string="Titel", required=True, translate=True)
    system_type_id = fields.Many2one(
        "ingtec.system.type",
        string="Anlagenart",
        ondelete="cascade",
        help="Leer lassen für übergreifende Regeln, die für jede Anlage gelten.",
    )
    scope = fields.Selection(
        [("instance", "Je Anlage"), ("object", "Je Objekt")],
        string="Geltungsbereich",
        default="instance",
        required=True,
    )

    conditions = fields.Json(
        string="Bedingungen",
        default=lambda self: {"all": []},
        help="Bedingungsbaum aus all/any/not und Blattbedingungen {fact, op, value}.",
    )

    # --- Ergebnis ---------------------------------------------------------
    outcome_kind = fields.Selection(
        [
            ("pruefung", "Prüfung"),
            ("wartung", "Wartung"),
            ("inspektion", "Inspektion"),
            ("revision", "Revision"),
            ("dokumentation", "Dokumentation"),
            ("abklaerung", "Abklärung"),
        ],
        string="Ergebnisart",
        required=True,
        default="pruefung",
    )
    outcome_statement = fields.Text(string="Ergebnistext", required=True, translate=True)
    outcome_interval_value = fields.Integer(string="Intervall")
    outcome_interval_unit = fields.Selection(
        [("month", "Monate"), ("year", "Jahre")], string="Einheit", default="year"
    )
    outcome_documents = fields.Text(string="Benötigte Unterlagen", help="Eine Position je Zeile.")
    recommended_action = fields.Text(string="Empfohlener Schritt", translate=True)

    # --- Aussagequalität und Priorität (Abschnitt 23, 25) ---------------
    assertion_quality = fields.Selection(
        [
            ("behoerdlich", "Behördliche Vorgabe"),
            ("gesetzlich", "Gesetzlich"),
            ("regelwerk", "Technisches Regelwerk"),
            ("norm", "Norm"),
            ("hersteller", "Herstelleranforderung"),
            ("empfehlung", "Fachliche INGTEC-Empfehlung"),
        ],
        string="Aussagequalität",
        required=True,
        default="empfehlung",
    )
    priority = fields.Selection(
        [
            ("1", "1 – Konkrete behördliche Vorgabe"),
            ("2", "2 – Unmittelbare Rechtsvorschrift"),
            ("3", "3 – Technisches Regelwerk"),
            ("4", "4 – Norm"),
            ("5", "5 – Herstelleranforderung"),
            ("6", "6 – Fachliche INGTEC-Empfehlung"),
        ],
        string="Priorität",
        compute="_compute_priority",
        store=True,
        readonly=False,
        help="Wird aus der Aussagequalität abgeleitet und kann begründet abweichen.",
    )
    legal_basis = fields.Text(string="Rechtsgrundlage", required=True)

    # --- Versionierung und Freigabe (Abschnitt 24) ------------------------
    version = fields.Char(string="Version", required=True, default="1.0")
    valid_from = fields.Date(string="Gültig ab", required=True, default=fields.Date.context_today)
    valid_to = fields.Date(string="Gültig bis")
    state = fields.Selection(
        [
            ("draft", "Entwurf"),
            ("review", "In fachlicher Prüfung"),
            ("approved", "Freigegeben"),
            ("withdrawn", "Zurückgezogen"),
            ("archived", "Archiviert"),
        ],
        string="Status",
        default="draft",
        required=True,
        tracking=True,
    )
    reviewed_by = fields.Many2one("res.users", string="Fachlich geprüft von", readonly=True)
    reviewed_on = fields.Date(string="Fachlich geprüft am", readonly=True)
    approved_by = fields.Many2one("res.users", string="Freigegeben von", readonly=True)
    approved_on = fields.Date(string="Freigegeben am", readonly=True)
    source_status = fields.Selection(
        [
            ("red", "Ungeprüft"),
            ("yellow", "Vorperiode"),
            ("green", "Fachlich verifiziert"),
        ],
        string="Quellenstatus",
        default="red",
        required=True,
    )
    active = fields.Boolean(default=True)

    _sql_constraints = [
        ("code_version_uniq", "unique(code, version)", "Regel-ID und Version müssen eindeutig sein."),
    ]

    @api.depends("assertion_quality")
    def _compute_priority(self):
        for rule in self:
            rule.priority = PRIORITY_BY_QUALITY.get(rule.assertion_quality, "6")

    # --- Freigabeworkflow -------------------------------------------------

    def action_submit_review(self):
        self.filtered(lambda rule: rule.state == "draft").write({"state": "review"})

    def action_mark_reviewed(self):
        self.write(
            {
                "reviewed_by": self.env.user.id,
                "reviewed_on": fields.Date.context_today(self),
            }
        )

    def action_approve(self):
        """Gibt Regeln frei. Erst danach erzeugen sie Ergebnisse für externe
        Nutzer (Abschnitt 24)."""
        for rule in self:
            if rule.state not in ("draft", "review"):
                raise UserError(
                    _("Die Regel %s kann im Status '%s' nicht freigegeben werden.")
                    % (rule.code, rule.state)
                )
            if not rule.reviewed_on:
                raise UserError(
                    _("Die Regel %s muss vor der Freigabe fachlich geprüft werden.") % rule.code
                )
        self.write(
            {
                "state": "approved",
                "approved_by": self.env.user.id,
                "approved_on": fields.Date.context_today(self),
                "source_status": "green",
            }
        )

    def action_withdraw(self):
        self.write({"state": "withdrawn"})

    def action_archive_rule(self):
        self.write({"state": "archived", "active": False})

    def action_reset_draft(self):
        self.write({"state": "draft"})

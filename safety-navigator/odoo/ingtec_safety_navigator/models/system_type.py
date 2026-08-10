# -*- coding: utf-8 -*-
"""Anlagenstamm – Spezifikation Abschnitt 13 und 14."""

from odoo import fields, models


class SystemType(models.Model):
    _name = "ingtec.system.type"
    _description = "INGTEC Anlagentyp"
    _order = "sequence, name"

    # --- Identifikation ---------------------------------------------------
    code = fields.Char(
        string="Anlagen-ID",
        required=True,
        index=True,
        help="Sprechende ID, zum Beispiel SYS-AT-GATE-001.",
    )
    name = fields.Char(string="Bezeichnung", required=True, translate=True)
    category_id = fields.Many2one(
        "ingtec.system.category", string="Kategorie", required=True, ondelete="restrict"
    )
    secondary_category_ids = fields.Many2many(
        "ingtec.system.category",
        "ingtec_system_type_secondary_category_rel",
        "type_id",
        "category_id",
        string="Weitere Kategorien",
        help="Feinere fachliche Zuordnung neben der primären Kategorie.",
    )
    synonym_ids = fields.One2many("ingtec.system.type.synonym", "system_type_id", string="Synonyme")
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

    # --- Beschreibung -----------------------------------------------------
    layman_description = fields.Text(
        string="Laienbeschreibung",
        translate=True,
        help="Erklärung ohne Fachbegriffe – wird im Tooltip und im Detailpanel gezeigt.",
    )
    technical_description = fields.Text(string="Technische Beschreibung", translate=True)
    image = fields.Image(string="Detailansicht")
    icon = fields.Char(string="Icon")

    # --- Visualisierung (Abschnitt 16) ------------------------------------
    svg_layer_id = fields.Char(string="SVG Layer")
    svg_object_id = fields.Char(string="SVG Objekt-ID")
    hotspot_id = fields.Char(string="Hotspot-ID")
    hotspot_x = fields.Integer(string="Hotspot X")
    hotspot_y = fields.Integer(string="Hotspot Y")
    hotspot_area = fields.Char(string="Verortung", help="Beispiel: Hallendach, Technikraum.")

    # --- Relevanz (Abschnitt 14) ------------------------------------------
    maintenance_relevant = fields.Boolean(string="Wartung relevant")
    inspection_relevant = fields.Boolean(string="Inspektion relevant")
    test_relevant = fields.Boolean(string="Prüfung relevant")
    revision_relevant = fields.Boolean(string="Revision relevant")

    interval_value = fields.Integer(string="Typische Prüffrist")
    interval_unit = fields.Selection(
        [("month", "Monate"), ("year", "Jahre")], string="Einheit", default="year"
    )
    interval_note = fields.Char(string="Hinweis zur Frist")
    interval_type = fields.Selection(
        [
            ("recurring", "wiederkehrend"),
            ("initial", "erstmalig vor Inbetriebnahme"),
            ("event", "anlassbezogen"),
            ("continuous", "laufend"),
        ],
        string="Fristart",
        default="recurring",
    )
    test_type = fields.Char(string="Prüfart")

    # --- Zuständigkeit ---------------------------------------------------
    department = fields.Char(string="INGTEC-Fachbereich")
    expertise = fields.Char(string="Erforderliche Fachkunde")

    # --- Fachliche Inhalte ------------------------------------------------
    required_documents = fields.Text(string="Benötigte Unterlagen", help="Eine Position je Zeile.")
    typical_hazards = fields.Text(string="Typische Gefährdungen", help="Eine Position je Zeile.")
    typical_defects = fields.Text(string="Typische Mängel", help="Eine Position je Zeile.")
    legal_bases = fields.Text(string="Mögliche Rechtsgrundlagen", help="Eine Position je Zeile.")
    standard_trvb = fields.Char(string="TRVB")
    standard_onorm = fields.Char(string="ÖNORM")
    standard_en = fields.Char(string="EN")
    standard_iso = fields.Char(string="ISO")
    manufacturer_requirements = fields.Text(string="Herstelleranforderungen")
    permit_relevant = fields.Boolean(string="Bescheidrelevanz")
    safety_score_category = fields.Char(string="Safety-Score(R)-Kategorie")

    # --- Qualitätssicherung ----------------------------------------------
    source_status = fields.Selection(
        [
            ("red", "Ungeprüft – vollständig prüfen"),
            ("yellow", "Vorperiode – aktualisieren"),
            ("green", "Fachlich verifiziert"),
        ],
        string="Quellenstatus",
        default="red",
        required=True,
        help="Quellenampel der INGTEC-Systematik. Nur grüne Inhalte gelten als verifiziert.",
    )
    reviewed_by = fields.Many2one("res.users", string="Fachlich geprüft von")
    reviewed_on = fields.Date(string="Fachlich geprüft am")

    rule_ids = fields.One2many("ingtec.rule", "system_type_id", string="Regeln")

    _sql_constraints = [
        ("code_uniq", "unique(code)", "Die Anlagen-ID muss eindeutig sein."),
    ]

    def action_mark_reviewed(self):
        """Setzt den Quellenstatus auf verifiziert."""
        self.write(
            {
                "source_status": "green",
                "reviewed_by": self.env.user.id,
                "reviewed_on": fields.Date.context_today(self),
            }
        )


class SystemTypeSynonym(models.Model):
    _name = "ingtec.system.type.synonym"
    _description = "Synonym eines Anlagentyps"
    _order = "sequence, name"

    name = fields.Char(string="Synonym", required=True, translate=True)
    system_type_id = fields.Many2one("ingtec.system.type", required=True, ondelete="cascade")
    sequence = fields.Integer(default=10)

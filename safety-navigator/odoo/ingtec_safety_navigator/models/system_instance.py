# -*- coding: utf-8 -*-
"""Anlageninstanz – Spezifikation Abschnitt 21.

Eine Anlage im Kundenbetrieb ist nicht identisch mit einem Anlagentyp: der Typ
beschreibt die Gattung, die Instanz die konkrete Anlage mit Anzahl, Standort,
Hersteller, Baujahr und Prüfstand.
"""

from odoo import fields, models


class SystemInstance(models.Model):
    _name = "ingtec.system.instance"
    _description = "INGTEC Anlageninstanz"
    _order = "sequence, id"

    session_id = fields.Many2one(
        "ingtec.navigator.session", string="Session", required=True, ondelete="cascade", index=True
    )
    system_type_id = fields.Many2one(
        "ingtec.system.type", string="Anlagentyp", required=True, ondelete="restrict"
    )
    name = fields.Char(related="system_type_id.name", string="Bezeichnung", store=False)
    sequence = fields.Integer(default=10)

    selection_state = fields.Selection(
        [
            ("has", "Vorhanden"),
            ("unsure", "Unsicher"),
            ("not_present", "Nicht vorhanden"),
        ],
        string="Auswahl",
        default="has",
        required=True,
        help="'Unsicher' entspricht der Antwort 'Bin nicht sicher' im Navigator.",
    )

    quantity = fields.Integer(string="Anzahl", default=1)
    location = fields.Char(string="Standort")
    manufacturer = fields.Char(string="Hersteller")
    year_built = fields.Integer(string="Baujahr")
    last_inspection = fields.Date(string="Letzte Prüfung")
    last_inspection_unknown = fields.Boolean(
        string="Letzte Prüfung unbekannt",
        help="Ein unbekannter Prüfstand wird fachlich wie ein fehlender Prüfstand behandelt.",
    )
    maintenance_contract = fields.Boolean(string="Wartungsvertrag")
    report_available = fields.Boolean(string="Prüfbericht vorhanden")
    known_defects = fields.Boolean(string="Bekannte Mängel")

    facts = fields.Json(
        string="Anlagenfakten",
        default=dict,
        help="Antworten auf anlagenspezifische Fragen; Schlüssel ohne Namensraum-Präfix.",
    )
    note = fields.Text(string="Anmerkung")

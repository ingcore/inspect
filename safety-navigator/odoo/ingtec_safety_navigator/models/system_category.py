# -*- coding: utf-8 -*-
"""Anlagenkategorien – Spezifikation Abschnitt 12."""

from odoo import fields, models


class SystemCategory(models.Model):
    _name = "ingtec.system.category"
    _description = "INGTEC Anlagenkategorie"
    _order = "sequence, name"

    code = fields.Char(string="Code", required=True, index=True)
    name = fields.Char(string="Bezeichnung", required=True, translate=True)
    short_description = fields.Text(string="Kurzbeschreibung", translate=True)
    svg_layer_id = fields.Char(
        string="SVG Layer",
        help="Layer der Gebäudegrafik, dem die Anlagen dieser Kategorie zugeordnet werden.",
    )
    color = fields.Char(string="Farbe", help="Darstellungsfarbe von Hotspots und Chips.")
    icon = fields.Char(string="Icon")
    department = fields.Char(string="Zuständiger INGTEC-Fachbereich")
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

    system_type_ids = fields.One2many("ingtec.system.type", "category_id", string="Anlagentypen")

    _sql_constraints = [
        ("code_uniq", "unique(code)", "Der Kategoriecode muss eindeutig sein."),
    ]

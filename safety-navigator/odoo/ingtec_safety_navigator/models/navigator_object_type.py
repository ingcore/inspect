# -*- coding: utf-8 -*-
"""Objektarten – Spezifikation Abschnitt 11."""

from odoo import fields, models


class NavigatorObjectType(models.Model):
    _name = "ingtec.navigator.object_type"
    _description = "INGTEC Navigator Objektart"
    _order = "priority, name"

    code = fields.Char(string="Code", required=True, index=True)
    name = fields.Char(string="Bezeichnung", required=True, translate=True)
    short_description = fields.Text(string="Kurzbeschreibung", translate=True)
    image = fields.Image(string="Bild")
    svg_variant = fields.Char(
        string="SVG-Visualisierung",
        help="Variante der Gebäudegrafik, die für diese Objektart gezeigt wird.",
    )
    category_ids = fields.Many2many(
        "ingtec.system.category",
        string="Aktive Anlagenkategorien",
        help="Nur Anlagen dieser Kategorien werden für die Objektart angeboten.",
    )
    priority = fields.Integer(string="Priorität", default=10)
    slug = fields.Char(string="URL-Slug", required=True)
    seo_title = fields.Char(string="SEO-Titel", translate=True)
    seo_description = fields.Text(string="SEO-Beschreibung", translate=True)
    default_facts = fields.Json(
        string="Vorbelegte Objektfakten",
        default=dict,
        help="Reduziert Rückfragen. Nutzerantworten haben immer Vorrang.",
    )
    active = fields.Boolean(default=True)

    _sql_constraints = [
        ("code_uniq", "unique(code)", "Der Objektartcode muss eindeutig sein."),
        ("slug_uniq", "unique(slug)", "Der URL-Slug muss eindeutig sein."),
    ]

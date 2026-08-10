# -*- coding: utf-8 -*-
"""Verknüpfung des Navigators mit dem CRM (Zielarchitektur Abschnitt 2 und 4)."""

from odoo import fields, models


class CrmLead(models.Model):
    _inherit = "crm.lead"

    navigator_session_id = fields.Many2one(
        "ingtec.navigator.session",
        string="Safety-Navigator-Session",
        readonly=True,
        index=True,
        help="Vorgang im Safety Navigator, aus dem dieser Lead entstanden ist.",
    )
    navigator_reference = fields.Char(
        related="navigator_session_id.reference", string="Navigator-Referenz", store=True
    )

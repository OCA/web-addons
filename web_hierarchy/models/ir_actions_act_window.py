# -*- coding: utf-8 -*-
#   © 2019 Kevin Kamau
#   License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo import fields, models, _


class IrActionsActWindow(models.Model):
    _inherit = 'ir.actions.act_window'

    view_type = fields.Selection(selection_add=[('hierarchy', _('Hierarchy'))])

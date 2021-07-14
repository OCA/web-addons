from odoo import models


class BaseModel(models.BaseModel):
    _inherit = 'base'

    def ensure_xml_id(self, skip=False):
        """ Public version of `__ensure_xml_id` used by DebugManager
        """
        return self.__ensure_xml_id(skip)

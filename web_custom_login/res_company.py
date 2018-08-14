# -*- coding: utf-8 -*-
# © initOS GmbH 2013
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp.osv import fields, osv
from openerp.tools import image_resize_image


class ResCompany(osv.Model):
    _inherit = 'res.company'

    def _get_login_logo_web(
            self, cr, uid, ids, _field_name, _args, context=None):
        result = dict.fromkeys(ids, False)
        for record in self.browse(cr, uid, ids, context=context):
            size = (180, None)
            image = record.login_image if record.has_login_image \
                else record.partner_id.image
            result[record.id] = image_resize_image(image, size)
        return result

    def _has_login_image(self, cr, uid, ids, name, args, context=None):
        result = {}
        for obj in self.browse(cr, uid, ids, context=context):
            result[obj.id] = obj.login_image is not False
        return result

    _columns = {
        'style_css': fields.text('Custom Cascading Style Sheet (CSS)'),

        'login_logo_web': fields.function(
            _get_login_logo_web,
            string='Login Logo Web',
            type='binary',
            store=True,
        ),
        'login_image': fields.binary(
            string='Login Image',
            help="This field holds the image used on the login screen, "
                 "limited to 1024x1024px.",
        ),
        'has_login_image': fields.function(
            _has_login_image,
            type="boolean",
            string='Has Login Image?',
        ),
    }

    _defaults = {
        'style_css': """/* copied from web/static/src/css/base.css */
.openerp .oe_login .oe_login_bottom {
background-image: linear-gradient(to bottom, #b41616, #600606);
}
.openerp .oe_login button {
background-color:#138c13;
background-image: linear-gradient(to bottom, #b92020, #600606);
}"""
    }

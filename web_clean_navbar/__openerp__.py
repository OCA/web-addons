# -*- coding: utf-8 -*-
##############################################################################
#
#    Odoo Addon, Open Source Management Solution
#    Copyright (C) 2014-now Equitania Software GmbH(<http://www.equitania.de>).
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

{
    'name': 'web_clean_navbar',
    'version': '1.0.0',
    'category': 'Backend',
    'description': """
        Better visibility for the main backend navigation-bar
    """,
    'author': 'Equitania Software GmbH',
    'website': 'www.myodoo.de',
    'depends': [],
    'summary': 'backend, navigation',
    #'init': [
    #         'eq_install_func.xml', 
    #         ],
    'data': [
        'views/clean_navbar.xml',
    ],
    'demo': [],
    'css': ['base.css'],
    'installable': True,
    'auto_install': False,
}

//-*- coding: utf-8 -*-
//############################################################################
//
//   OpenERP, Open Source Management Solution
//   This module copyright
//     (c) 2015 Domatix (http://www.domatix.com)
//              Angel Moya <angel.moya@domatix.com>
//
//   This program is free software: you can redistribute it and/or modify
//   it under the terms of the GNU Affero General Public License as
//   published by the Free Software Foundation, either version 3 of the
//   License, or (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU Affero General Public License for more details.
//
//   You should have received a copy of the GNU Affero General Public License
//   along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
//############################################################################

openerp.web.ListView.include({
    /**
     * Override all list view to add sticky header behavior
     **/
    init: function(parent, dataset, view_id, options) {
     var self = this;
     self._super(parent, dataset, view_id, options);
     self.on("list_view_loaded", self, function() {
        var $table = self.$.find("table.oe_list_content");
        $table.floatThead({
            scrollContainer: function($table){
                return $table.closest('.wrapper');
            }
        });
     },
});

# -*- coding: utf-8 -*-
from odoo import fields, models


class BlogPost(models.Model):
    _inherit = 'blog.post'

    is_featured = fields.Boolean(
        string='Bài tiêu biểu',
        index=True,
        copy=False,
        help='Các snippet HAMI có thể chọn bài này làm bài tiêu biểu của blog.',
    )

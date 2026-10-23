# -*- coding: utf-8 -*-
import json
import re

from odoo import api, fields, models

_COVER_URL_RE = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)")


class BlogPost(models.Model):
    _inherit = 'blog.post'

    is_featured = fields.Boolean(
        string='Bài tiêu biểu',
        index=True,
        copy=False,
        help='Các snippet HAMI có thể chọn bài này làm bài tiêu biểu của blog.',
    )
    hami_cover_url = fields.Char(
        string='Ảnh bìa (URL)', compute='_compute_hami_cover_url')

    @api.depends('cover_properties')
    def _compute_hami_cover_url(self):
        """Lấy URL ảnh từ `cover_properties` (JSON, khóa `background-image`)."""
        for post in self:
            try:
                props = json.loads(post.cover_properties or '{}')
            except ValueError:
                props = {}
            match = _COVER_URL_RE.search(props.get('background-image') or '')
            post.hami_cover_url = match.group(1) if match else False

    # ------------------------------------------------------------------
    # Helpers dùng chung cho controller (snippet) và template (trang blog)
    # ------------------------------------------------------------------
    @api.model
    def _hami_published_domain(self, blog_id=-1):
        """Bài đã publish, đã tới giờ đăng, đúng website hiện tại."""
        website = self.env['website'].get_current_website()
        domain = list(website.website_domain()) + [
            ('website_published', '=', True),
            ('post_date', '<=', fields.Datetime.now()),
        ]
        if blog_id and blog_id > 0:
            domain.append(('blog_id', '=', blog_id))
        return domain

    @api.model
    def hami_most_viewed(self, blog_id=-1, limit=5):
        """Bài xem nhiều nhất (theo `visits`); gọi được từ QWeb."""
        return self.search(
            self._hami_published_domain(blog_id),
            order='visits desc, post_date desc, id desc', limit=limit)

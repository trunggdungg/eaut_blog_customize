# -*- coding: utf-8 -*-
import json
import re

from odoo import fields, http
from odoo.http import request

_COVER_URL_RE = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)")


def _to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_bool(value):
    return str(value).lower() in ('1', 'true', 'yes')


class HamiBlog(http.Controller):
    """Trả về HTML (đã render bằng QWeb) cho các snippet động của HAMI."""

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _domain(self, blog_id=-1):
        domain = list(request.website.website_domain())
        domain += [
            ('website_published', '=', True),
            ('post_date', '<=', fields.Datetime.now()),
        ]
        if blog_id and blog_id > 0:
            domain.append(('blog_id', '=', blog_id))
        return domain

    def _cover_url(self, post):
        try:
            props = json.loads(post.cover_properties or '{}')
        except ValueError:
            return False
        match = _COVER_URL_RE.search(props.get('background-image') or '')
        return match.group(1) if match else False

    def _pick_post(self, domain, mode, post_id):
        """Chọn bài tiêu biểu theo quy tắc admin đặt: latest | featured | manual."""
        Post = request.env['blog.post']
        if mode == 'manual' and post_id:
            post = Post.search(domain + [('id', '=', post_id)], limit=1)
            if post:
                return post
        if mode == 'featured':
            post = Post.search(
                domain + [('is_featured', '=', True)],
                order='post_date desc, id desc', limit=1)
            if post:
                return post
        # 'latest' và mọi trường hợp lùi về
        return Post.search(domain, order='post_date desc, id desc', limit=1)

    def _blog_url(self, blog_id):
        if blog_id and blog_id > 0:
            blog = request.env['blog.blog'].browse(blog_id).exists()
            if blog:
                return '/blog/%s' % request.env['ir.http']._slug(blog)
        return '/blog'

    def _render(self, template, values):
        values['cover_of'] = self._cover_url
        return request.render(template, values)

    # ------------------------------------------------------------------
    # Routes
    # ------------------------------------------------------------------
    @http.route('/hami_blog/column', type='http', auth='public',
                website=True, methods=['GET'], sitemap=False)
    def column(self, blog_id=-1, mode='latest', post_id=0, show_image='true',
               show_date='true', show_teaser='false', **kw):
        blog_id = _to_int(blog_id, -1)
        post = self._pick_post(self._domain(blog_id), mode, _to_int(post_id))
        return self._render('hami_blog.column_body', {
            'post': post,
            'show_image': _to_bool(show_image),
            'show_date': _to_bool(show_date),
            'show_teaser': _to_bool(show_teaser),
        })

    @http.route('/hami_blog/category', type='http', auth='public',
                website=True, methods=['GET'], sitemap=False)
    def category(self, blog_id=-1, mode='latest', post_id=0, limit=3,
                 show_image='true', show_date='true',
                 viewall_label='Xem tất cả', **kw):
        blog_id = _to_int(blog_id, -1)
        limit = max(0, min(_to_int(limit, 3), 20))
        domain = self._domain(blog_id)
        featured = self._pick_post(domain, mode, _to_int(post_id))
        others = request.env['blog.post']
        if featured and limit:
            others = request.env['blog.post'].search(
                domain + [('id', '!=', featured.id)],
                order='post_date desc, id desc', limit=limit)
        return self._render('hami_blog.category_body', {
            'featured': featured,
            'others': others,
            'show_image': _to_bool(show_image),
            'show_date': _to_bool(show_date),
            'viewall_label': viewall_label,
            'blog_url': self._blog_url(blog_id),
        })

    @http.route('/hami_blog/most_viewed', type='http', auth='public',
                website=True, methods=['GET'], sitemap=False)
    def most_viewed(self, blog_id=-1, limit=5, show_date='true', **kw):
        blog_id = _to_int(blog_id, -1)
        limit = max(1, min(_to_int(limit, 5), 20))
        posts = request.env['blog.post'].search(
            self._domain(blog_id), order='visits desc, post_date desc, id desc',
            limit=limit)
        return self._render('hami_blog.most_viewed_body', {
            'posts': posts,
            'show_date': _to_bool(show_date),
        })

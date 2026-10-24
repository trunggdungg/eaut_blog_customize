# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request


def _to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_bool(value):
    return str(value).lower() in ('1', 'true', 'yes')


class CompanyBlog(http.Controller):
    """Trả về HTML (đã render bằng QWeb) cho các snippet động của blog_company."""

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # Routes
    # ------------------------------------------------------------------
    @http.route('/blog_company/column', type='http', auth='public',
                website=True, methods=['GET'], sitemap=False)
    def column(self, blog_id=-1, mode='latest', post_id=0, show_image='true',
               show_date='true', show_teaser='false', **kw):
        Post = request.env['blog.post']
        blog_id = _to_int(blog_id, -1)
        post = self._pick_post(
            Post._company_published_domain(blog_id), mode, _to_int(post_id))
        return request.render('blog_company.column_body', {
            'post': post,
            'show_image': _to_bool(show_image),
            'show_date': _to_bool(show_date),
            'show_teaser': _to_bool(show_teaser),
        })

    @http.route('/blog_company/category', type='http', auth='public',
                website=True, methods=['GET'], sitemap=False)
    def category(self, blog_id=-1, mode='latest', post_id=0, limit=3,
                 show_image='true', show_date='true',
                 viewall_label='Xem tất cả', **kw):
        Post = request.env['blog.post']
        blog_id = _to_int(blog_id, -1)
        limit = max(0, min(_to_int(limit, 3), 20))
        domain = Post._company_published_domain(blog_id)
        featured = self._pick_post(domain, mode, _to_int(post_id))
        others = Post
        if featured and limit:
            others = Post.search(
                domain + [('id', '!=', featured.id)],
                order='post_date desc, id desc', limit=limit)
        return request.render('blog_company.category_body', {
            'featured': featured,
            'others': others,
            'show_image': _to_bool(show_image),
            'show_date': _to_bool(show_date),
            'viewall_label': viewall_label,
            'blog_url': self._blog_url(blog_id),
        })

    @http.route('/blog_company/most_viewed', type='http', auth='public',
                website=True, methods=['GET'], sitemap=False)
    def most_viewed(self, blog_id=-1, limit=5, show_date='true', **kw):
        limit = max(1, min(_to_int(limit, 5), 20))
        posts = request.env['blog.post'].company_most_viewed(
            _to_int(blog_id, -1), limit)
        return request.render('blog_company.most_viewed_body', {
            'posts': posts,
            'show_date': _to_bool(show_date),
        })

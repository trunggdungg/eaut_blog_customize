# -*- coding: utf-8 -*-
{
    'name': 'Blog Company',
    'summary': 'Giao diện tin tức dùng chung: snippet kéo thả cho Blog của Odoo',
    'description': """
Mở rộng website_blog (Odoo 19):
 - Trường "Bài tiêu biểu" (is_featured) trên bài viết.
 - Snippet "Hoạt động công ty": nhiều cột, mỗi cột một bài tiêu biểu của một blog.
 - Snippet "Tin tức theo thể loại": card gồm 1 bài tiêu biểu + N tiêu đề + Xem tất cả.
 - Trang chi tiết bài: bật/tắt khối "Đăng ký hội viên", "Xem nhiều" trong panel Blog Page.
    """,
    'category': 'Website/Website',
    'version': '19.0.1.0.0',
    'license': 'LGPL-3',
    'depends': ['website_blog'],
    'data': [
        'views/blog_post_views.xml',
        'views/blog_company_templates.xml',
        'views/blog_post_detail_templates.xml',
        'views/snippets/snippets.xml',
        'views/snippets/s_company_activities.xml',
        'views/snippets/s_company_news_blocks.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'blog_company/static/src/scss/blog_company.scss',
            'blog_company/static/src/interactions/**/*.js',
        ],
        'website.website_builder_assets': [
            'blog_company/static/src/website_builder/**/*',
        ],
    },
    'installable': True,
    'application': False,
}

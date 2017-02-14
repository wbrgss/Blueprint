# -*- coding: utf-8 -*-

# Define here the models for your scraped items
#
# See documentation in:
# http://doc.scrapy.org/en/latest/topics/items.html

import scrapy


class CourseItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    subject = scrapy.Field()
    code = scrapy.Field()
    cid = scrapy.Field()
    title = scrapy.Field()
    credits = scrapy.Field()
    overview = scrapy.Field()
    terms = scrapy.Field()
    instructors = scrapy.Field()
    programs = scrapy.Field()

    preqs = scrapy.Field()
    creqs = scrapy.Field()


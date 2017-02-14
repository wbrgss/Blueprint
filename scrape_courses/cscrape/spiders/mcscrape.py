#!/usr/bin/env python
# -*- coding: utf-8 -*-

import scrapy
import re

from cscrape.items import CourseItem

class McScrape(scrapy.Spider):
    name="courses"
    allowed_domains = ["mcgill.ca"]

    def __init__(self, subject='COMP', *args, **kwargs):
        super(McScrape, self).__init__(*args, **kwargs)
        self.subject = subject
        YEAR = "2016-2017"
        self.start_urls = ["https://www.mcgill.ca/study/%s/courses/search?f[0]=field_subject_code:%s&f[1]=level:undergraduate" % (YEAR, subject)]

    def parse(self, response):

        for href in response.xpath('//h4[@class="field-content"]/a/@href').extract():
            yield scrapy.Request(response.urljoin(href), self.parse_course)

        next_page = response.css('.pager-next a::attr(href)').extract_first()
        if next_page is not None:
            url = response.urljoin(next_page)
            yield scrapy.Request(url, self.parse)

    def parse_course(self, response):
            item = CourseItem()
            #regex everything between last slash and last dash (in url)
            item['subject'] = (re.search(r'.*\/([^-]*)-.*', response.request.url).group(1).strip()).upper()

            #regex everything after last dash (in url)
            item['code'] = re.search(r'([^-]+$)', response.request.url).group(1).strip()

            #add em up
            item['cid'] = item['subject'] + " " + item['code']

            item['title'] = ((response.xpath('//div[@id="inner-container"]/h1/text()').extract_first()).strip( '\n' )[17:-17]).rstrip(' ')
            item['credits'] = re.search(r'.*?\((\d)', response.xpath('//div[@id="inner-container"]/h1/text()').extract_first().strip( '\n' )).group(1)
            item['overview'] = response.xpath('//div[@class="content"]/p/text()').extract_first().strip( '\n ' )
            item['terms']  = re.search(r'.*?\: (.*)', response.xpath('//p[@class="catalog-terms"]/text()').extract_first()).group(1).strip()
            item['instructors'] = re.search(r'.*?\: (.*)', response.xpath('//p[@class="catalog-instructors"]/text()').extract_first()).group(1).strip()

            #regex the whole sidebar list of programs 
            item['programs'] = response.css('.views-field-field-credit-hours a::text').extract()
        


            item['preqs'] = response.xpath('//ul[@class="catalog-notes"]/li/p[contains(., \'Prerequisite\')]/a/text()').extract()
            item['creqs'] = response.xpath('//ul[@class="catalog-notes"]/li/p[contains(., \'Corequisite\')]/a/text()').extract()

            yield item


angular.module('Collection').value('cjExtended',
  {
    "collection": {
    "version": "1.0",
    "href": "http://example.org/friends/",

    "links": [
      {"rel": "feed", "href": "http://example.org/friends/rss", "prompt": "Feed"}
    ],

    "items": [
      {
        "href": "http://example.org/friends/jdoe",
        "data": [
          {"name": "full-name", "value": "J. Doe", "prompt": "Full Name"},
          {"name": "email", "value": "jdoe@example.org", "prompt": "Email"}
        ],
        "links": [
          {"rel": "blog", "href": "http://examples.org/blogs/jdoe", "prompt": "Blog"},
          {"rel": "avatar", "href": "http://examples.org/images/jdoe", "prompt": "Avatar", "render": "image"}
        ]
      },

      {
        "href": "http://example.org/friends/msmith",
        "data": [
          {"name": "full-name", "value": "M. Smith", "prompt": "Full Name"},
          {"name": "email", "value": "msmith@example.org", "prompt": "Email"}
        ],
        "links": [
          {"rel": "blog", "href": "http://examples.org/blogs/msmith", "prompt": "Blog"},
          {"rel": "avatar", "href": "http://examples.org/images/msmith", "prompt": "Avatar", "render": "image"}
        ]
      },

      {
        "href": "http://example.org/friends/rwilliams",
        "data": [
          {"name": "full-name", "value": "R. Williams", "prompt": "Full Name"},
          {"name": "email", "value": "rwilliams@example.org", "prompt": "Email"}
        ],
        "links": [
          {"rel": "blog", "href": "http://examples.org/blogs/rwilliams", "prompt": "Blog"},
          {"rel": "avatar", "href": "http://examples.org/images/rwilliams", "prompt": "Avatar", "render": "image"}
        ]
      }
    ],

    "queries": [
      {"rel": "search", "href": "http://example.org/friends/search", "prompt": "Search",
        "data": [
          {"name": "search", "value": ""}
        ]
      }
    ],

    "template": {
      "data": [
        {
          "name": "full-name",
          "value": "Joe",
          "prompt": "Full Name",
          errors: [
            "Cannot be Joe"
          ]},
        {
          "name": "email",
          "value": "",
          "prompt": "Email",
          "regexp": "[^@]+@[^@]+"
        },
        {
          "name": "blog",
          "value": "",
          "prompt": "Blog",
          "required": true
        },
        {
          "name": "avatar",
          "value": "",
          "prompt": "Avatar",
          "options": [
            { "prompt": "Blue Barricuda", "value": "bb" },
            { "prompt": "Purple Parrot", "value": "pp" },
            { "prompt": "Red Jaguars", "value": "rj" }
          ]
        }
      ]
    },

    "meta": {
      "totalResults": 100
    }
  }
  }
)

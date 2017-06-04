var express = require('express');
var exphbs = require('express-handlebars');
const contentful = require('contentful');
const marked = require('marked');

var data = require('./data/page.json');

const SPACE_ID = process.env.SPACE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const CONTENTFUL_HOST = process.env.STAGE === 'dev'
    ? 'preview.contentful.com'
    : 'cdn.contentful.com';

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
});

const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: SPACE_ID,
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: ACCESS_TOKEN,
    host: CONTENTFUL_HOST
});

const getPage = (entries, pageKey) =>
    entries.items.filter(entry => entry.fields.pageKey === pageKey);

var app = express();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', function(req, res) {
    res.render('index', {
        title: 'Rockstar Wedding. You Film. We Edit. Wedding videos with personality.',
        description: 'We make fun, alternative wedding videos that are packed with laughs, personality and ace music that reflects you as a couple and your wedding day!'
    });
});

app.get('/blog', (req, res) => {
    client
        .getEntries({
            content_type: 'blogPost'
        })
        .then(blogPosts => {
            res.render('blog', {
                posts: blogPosts.items,
                title: 'The Rockstar Wedding blog',
                ogImage: 'https://rockstar.wedding/img/launch-sharer-new.png',
                description: 'Read blog posts from Rockstar Wedding'
            });
        });
});

app.get('/blog/:slug', (req, res) => {
    const blogPath = req.params.slug;
    client
        .getEntries({
            content_type: 'blogPost',
            'fields.url': blogPath
        })
        .then(blogPosts => {
            if (
                blogPosts.items &&
                blogPosts.items[0] &&
                blogPosts.items[0].fields
            ) {
                res.render('blog-item', {
                    title: (
                        `${blogPosts.items[0].fields.title} | Rockstar Wedding`
                    ),
                    description: blogPosts.items[0].fields.listingSubtitle,
                    ogImage: (
                        blogPosts.items[0].fields.mainImage &&
                            blogPosts.items[
                                0
                            ].fields.mainImage.fields.file.url ||
                            'https://rockstar.wedding/img/launch-sharer-new.png'
                    ),
                    post: blogPosts.items[0].fields,
                    postBody: marked(blogPosts.items[0].fields.body)
                });
            } else {
                res.status(404);
                res.render('404');
            }
        });
});

// Map the default pages
data.pages.map(page => {
    // Redirect all .html extentions
    app.get('/' + page + '.html', (req, res) => {
        res.redirect(301, '/' + page);
    });

    app.get('/' + page, (req, res) => {
        client.getEntries().then(entries => {
            // Get the page from the response
            const fetchedPaged = getPage(entries, page);
            const pageFields = fetchedPaged[0] && fetchedPaged[0].fields || {};

            // Render the page using the fields from the API response
            res.render(
                page,
                Object.assign(
                    {},
                    {
                        title: 'Rockstar Wedding',
                        ogImage: '//rockstar.wedding/img/rockstar-wedding-sharer.png',
                        description: 'Wedding videos with personality'
                    },
                    pageFields
                )
            );
        });
    });
});

app.use(function(req, res, next) {
    res.status(404);
    res.render('404');
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});

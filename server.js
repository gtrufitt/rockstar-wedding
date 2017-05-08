var express = require('express');
var exphbs = require('express-handlebars');
var data = require('./data/page.json');
const contentful = require('contentful');

const SPACE_ID = process.env.SPACE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: SPACE_ID,
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: ACCESS_TOKEN
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
            console.log(blogPosts.items);
            res.render('blog', {
                posts: blogPosts.items
            });
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
            res.render(page, {
                title: pageFields.title || 'Rockstar Wedding',
                description: (
                    pageFields.description || 'Wedding videos with personality'
                )
            });
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

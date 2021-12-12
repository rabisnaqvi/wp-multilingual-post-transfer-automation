/**
 * THIS FILE CAN ONLY BE USED FOR REFERENCE PURPOSES TO TAKE OUT SNIPPETS OR SOMETHING
 * IDK, JUST NOT TAKING ANY LIABILITY OR DEPENDENCY FOR IT TO WORK. BUT YEA, THE TOOL'S
 * PRETTY HANDY... HEHE.
 * CONTACT ME IF YOU WANNA GRAP A CUP OF TEA AND NEED SOME HELP: rabisnaqvi@gmail.com
 */

const { Translate } = require('@google-cloud/translate').v2;
var fs = require('fs'), request = require('request'), WPAPI = require('wpapi'), mongoose = require("mongoose"), dotEnv = require("dotenv"), projectId = [YOURGOOGLEPROJECTID], rp = require('request-promise'), https = require('https'), Stream = require('stream').Transform, urlm = require('url'), path = require('path'), DomParser = require('dom-parser'), parser = new DomParser(), he = require('he');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const Post = require("./Post");
const OldMedia = require("./OldMedia");
const NewMedia = require("./NewMedia");

// OBJECT OF CATEGORIES TO REPLACE (enter ids)
let catReplacements = [
    {
        old: 123,
        new: 456
    },
    {
        old: 789,
        new: 123
    }
]

// enter exceptions (ids of posts that are already created)
let translatedPosts = [16022, 18083, 16407, 18997, 18921, 17045, 16649, 16031, 16010, 15988, 16701, 15915, 15907, 15730, 15717, 14288, 13445, 19306, 18964, 18847, 18790]

// ENDPOINT OF DUTCH SITE- uncomment this for fetching data from live
// var site1 = new WPAPI({
//     endpoint: 'https://site1.com/wp-json/',
//     username: '',
//     password: ''
// });
// ENDPOINT OF ENGLISH SITE- uncomment this for doing stuff on english site 
// var wp = new WPAPI({
//     endpoint: 'https://site2.com/wp-json/',
//     username: '',
//     password: ''
// });
// ---------------------------------------------------------------------------

dotEnv.config();
const translate = new Translate({ projectId });
const db = mongoose.connect(
    process.env.MONGO_PATH,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => {
        console.log("database connected");
    }
);
async function translateit(text) {
    // console.log('translation request received');
    const target = 'en';
    const [translation] = await translate.translate(text, target);
    return translation;
}

// STEP 6: UPLOAD CONTENT TO AQUARIUM365! !! PUT WP-YOAST API PLUGIN
// ---------------------------------------------------------

var translatedposts = new Promise(async function (resolve, reject) {
    const translatedPosts = await Post.find({});
    if (translatedPosts) {
        resolve(translatedPosts);
    }
    else {
        reject(Error("It broke"));
    }
});

translatedposts.then(function (tposts) {
    var promise = Promise.resolve();
    tposts.map(tpost => {
        promise = promise.then(function () {
            if (translatedPosts.indexOf(tpost.id) < 0) {
                // CREATE POSTS ON WP
                var extractedContent = parser.parseFromString(tpost.content);
                var firstptag = extractedContent.getElementsByTagName('p')[0].innerHTML;
                var parts = firstptag.split('.');
                var description = he.decode(parts.shift() + '.');
                if (description.length < 155) {
                    description = `${description} Read More in this Article!`;
                }
                wp.posts().create({
                    title: tpost.title,
                    content: tpost.content,
                    slug: tpost.slug,
                    featured_media: tpost.featuredImage,
                    categories: Object.values(tpost.categories),
                    yoast_meta: {
                        yoast_wpseo_metadesc: description,
                        yoast_wpseo_focuskw: tpost.title
                    },
                    status: 'publish'
                }).then(function (response) {
                    console.log('created', response.id);
                });
                return new Promise(function (resolve) {
                    setTimeout(resolve, 1000);
                });
            }
            return new Promise(function (resolve) {
                setTimeout(resolve, 1);
            });
        });
    });
    promise.then(function () {
        console.log('Loop finished.');
    });
}, function (err) {
    console.log('error retrieving posts', err);
});

// -----------------------------------------------------------
// END OF STEP 6


// STEP 5: UPLOADING MEDIA, GETTING THEIR IDS AND UPDATING TRANSLATED POSTS WITH THEM
// ----------------------------------------------------------------------------------

// var translatedMedia = new Promise(async function (resolve, reject) {
//     const newMedia = await NewMedia.find({});
//     if (newMedia) {
//         resolve(newMedia);
//     }
//     else {
//         reject(Error("It broke"));
//     }
// });

// translatedMedia.then(function (nmedias) {
//     var promise = Promise.resolve();
//     let n = 1;
//     nmedias.map(nmedia => {
//         promise = promise.then(function () {
//             wp.media()
//                 .file(`written/${nmedia.fileName}`)
//                 .create({
//                     title: nmedia.title,
//                     alt_text: nmedia.alt_text,
//                     caption: nmedia.caption,
//                     slug: nmedia.slug
//                 })
//                 .then(function (response) {
//                     // Your media is now uploaded: let's associate it with a post
//                     Post.findOneAndUpdate({ featuredImage: nmedia.oldid }, { featuredImage: response.id }, {}, function (err, doc) {
//                         if (err) console.log('Error updating post', doc.id, err);

//                         console.log('successfully updated post', doc.id);
//                     });
//                 })
//                 .catch(err => {
//                     console.log('Error is here 2', err);
//                 });
//             return new Promise(function (resolve) {
//                 setTimeout(resolve, 5000);
//             });
//         });
//     });
//     promise.then(function () {
//         console.log('Loop finished.');
//     });
// }, function (err) {
//     console.log('error retrieving newMedia', err);
// })
//     .catch(err => {
//         console.log('Error is here 1', err);
//     });


// ------------------------------------------------------------
// END OF STEP 5----------------------------------------------


// STEP 4: Translate Media & put with filenames in DB
// -----------------------------------------------------

// var notTranslatedMedia = new Promise(async function (resolve, reject) {
//     const oldMedia = await OldMedia.find({});
//     if (oldMedia) {
//         resolve(oldMedia);
//     }
//     else {
//         reject(Error("It broke"));
//     }
// });

// notTranslatedMedia.then(function (omedias) {
//     var promise = Promise.resolve();
//     omedias.map(omedia => {
//         promise = promise.then(function () {
//             var newmediaContent = {};
//             var url = new URL(omedia.url);
//             var extension = path.extname(url.pathname);
//             newmediaContent['oldid'] = omedia.id;
//             newmediaContent['fileName'] = `${omedia.id}${extension}`;
//             translateit(omedia.slug).then(translated => {
//                 newmediaContent['slug'] = translated;
//                 translateit(omedia.title).then(translated => {
//                     newmediaContent['title'] = translated;
//                     translateit(omedia.caption).then(translated => {
//                         newmediaContent['caption'] = translated;
//                         translateit(omedia.alt_text).then(translated => {
//                             newmediaContent['alt_text'] = translated;
//                             // all content is translated and is available in newmediaContent variable
//                             const putnewmedia = new NewMedia(newmediaContent);
//                             putnewmedia.save().then(savedMedia => {
//                                 console.log('saved media', savedMedia.id);
//                             }).catch(err => {
//                                 console.log('error saving media', err);
//                             });
//                         });
//                     });
//                 });
//             });
//             return new Promise(function (resolve) {
//                 setTimeout(resolve, 10000);
//             });
//         });
//     });
//     promise.then(function () {
//         console.log('Loop finished.');
//     });
// }, function (err) {
//     console.log('error retrieving oldMedia', err);
// });

// -----------------------------------------------------
// END STEP 4-------------------------------------------

// STEP 3: Download Media and name it with their old id
// -----------------------------------------------------

// var download = function (uri, filename, callback) {
//     var url = new URL(uri);
//     var extension = path.extname(url.pathname);
//     uri = uri.replace(/^http:\/\//i, 'https://');
//     // filename = filename.replace(" ", "");
//     https.request(uri, function (response) {
//         var data = new Stream();

//         response.on('data', function (chunk) {
//             data.push(chunk);
//         });

//         response.on('end', function () {
//             fs.writeFileSync(`written/${filename}${extension}`, data.read());
//             console.log('file wrote', filename, extension);
//         });
//     }).end();
// };

// var notTranslatedMedia = new Promise(async function (resolve, reject) {
//     const oldMedia = await OldMedia.find({});
//     if (oldMedia) {
//         resolve(oldMedia);
//     }
//     else {
//         reject(Error("It broke"));
//     }
// });

// notTranslatedMedia.then(function (omedias) {
//     var promise = Promise.resolve();
//     omedias.map(omedia => {
//         promise = promise.then(function () {
//             download(omedia.url, omedia.id);
//             return new Promise(function (resolve) {
//                 setTimeout(resolve, 1000);
//             });
//         });
//     });
//     promise.then(function () {
//         console.log('Loop finished.');
//     });
// }, function (err) {
//     console.log('error retrieving oldMedia', err);
// });

// -----------------------------------------------------
// END STEP 3-------------------------------------------


// STEP 2: GET UNTRANSLATED MEDIA, AND STORE INTO MONGODB
// ------------- TO CHECK WHICH IMAGE'S DATA DIDN'T DOWNLOAD AND THEN DOWNLOAD IT -----------------
// var notTranslatedMedia = new Promise(async function (resolve, reject) {
//     const oldMedia = await OldMedia.find({});
//     if (oldMedia) {
//         resolve(oldMedia);
//     }
//     else {
//         reject(Error("It broke"));
//     }
// });

// var translatedposts = new Promise(async function (resolve, reject) {
//     const translatedPosts = await Post.find({});
//     if (translatedPosts) {
//         resolve(translatedPosts);
//     }
//     else {
//         reject(Error("It broke"));
//     }
// });


// translatedposts.then(function (tposts) {
//     var promise = Promise.resolve();

//     notTranslatedMedia.then(function (omedias) {
//         var promise = Promise.resolve();
//         tposts.map(tpost => {
//             let found = false;
//             promise = promise.then(function () {
//                 omedias.map(omedia => {
//                     if (tpost.featuredImage == omedia.id) {
//                         found = true;
//                     }
//                 });
//                 if (!found) {
//                     getAndStoreMedia(tpost.featuredImage);
//                     console.log(`could not find image id: ${tpost.featuredImage}`);
//                 }
//                 return new Promise(function (resolve) {
//                     setTimeout(resolve, 5);
//                 });
//             });
//         });
//     }, function (err) {
//         console.log('error retrieving oldMedia', err);
//     });
//     promise.then(function () {
//         console.log('Loop finished.');
//     });
// }, function (err) {
//     console.log('error retrieving posts', err);
// });



// async function getAndStoreMedia(id) {
//     wp.media().id(id).then(function (data) {
//         const putoldmedia = new OldMedia({
//             id: data.id,
//             url: data.guid.rendered,
//             slug: data.slug,
//             title: data.title.rendered,
//             caption: data.caption.rendered,
//             alt_text: data.alt_text
//         });
//         putoldmedia.save().then(savedMedia => {
//             console.log('saved media', savedMedia.id);
//         }).catch(err => {
//             console.log('error saving media', err);
//         });
//     }).catch(function (err) {
//         console.log('error', err);
//     });
// }

// ------------------------------------------------------------------------------------

// var translatedposts = new Promise(async function (resolve, reject) {
//     const translatedPosts = await Post.find({});
//     if (translatedPosts) {
//         resolve(translatedPosts);
//     }
//     else {
//         reject(Error("It broke"));
//     }
// });

// translatedposts.then(function (tposts) {
//     var promise = Promise.resolve();
//     tposts.map(tpost => {
//         promise = promise.then(function () {
//             if (tpost.featuredImage) {
//                 getAndStoreMedia(tpost.featuredImage);
//             }
//             return new Promise(function (resolve) {
//                 setTimeout(resolve, 5000);
//             });
//         });
//     });
//     promise.then(function () {
//         console.log('Loop finished.');
//     });
// }, function (err) {
//     console.log('error retrieving posts', err);
// });
// -----------------------------------------------
// END OF STEP 2----------------------------------

// STEP 1: GET POSTS FROM LIVE, TRANSLATE THEM AND SAVE IN MONGO !!!!
// ------------------------------------------------------------------
// var options = {
//     uri: `http://staging2022.aquariumfans.nl/wp-json/wp/v2/posts/`,
//     qs: {
//         fields: 'id,slug,title,content,featured_media,categories',
//         per_page: 5,
//         page: 1
//     },
//     headers: {
//         'User-Agent': 'Request-Promise'
//     },
//     json: true // Automatically parses the JSON string in the response
// };

// rp(options)
//     .then(function (posts) {
//         var promise = Promise.resolve();
//         posts.forEach(post => {
//             promise = promise.then(function () {
//                 // replace categories on post
//                 catReplacements.map((cat) => {
//                     var index = post.categories.indexOf(cat.old);
//                     if (index !== -1) {
//                         post.categories[index] = cat.new;
//                     }
//                 });
//                 // translate post title
//                 translateit(post.title.rendered).then(translated => {
//                     post.title.rendered = translated;
//                     translateit(post.slug).then(translated => {
//                         post.slug = translated;
//                         translateit(post.content.rendered).then(translated => {
//                             post.content.rendered = translated;
//                             // everything is translated and put into post object. so now save it in mongo
//                             const putpost = new Post({
//                                 id: post.id,
//                                 title: post.title.rendered,
//                                 slug: post.slug,
//                                 categories: post.categories,
//                                 featuredImage: post.featured_media,
//                                 content: post.content.rendered
//                             });
//                             putpost.save().then(savedPost => {
//                                 console.log('saved post', savedPost.title);
//                             }).catch(err => {
//                                 console.log('error saving post', err);
//                             });
//                         });
//                     });
//                 });
//                 return new Promise(function (resolve) {
//                     setTimeout(resolve, 20000);
//                 });
//             });
//         });
//         promise.then(function () {
//             console.log('Loop finished.');
//         });
//     })
//     .catch(function (err) {
//         // API call failed..
//         console.log('error', err);
//     });

// async function getAndStorePosts(id) {
// wp.posts().perPage(5).page(22).then(function (posts) {
//     var promise = Promise.resolve();
//     posts.forEach(post => {
//         promise = promise.then(function () {
//             // replace categories on post
//             catReplacements.map((cat) => {
//                 var index = post.categories.indexOf(cat.old);
//                 if (index !== -1) {
//                     post.categories[index] = cat.new;
//                 }
//             });
//             // translate post title
//             translateit(post.title.rendered).then(translated => {
//                 post.title.rendered = translated;
//                 translateit(post.slug).then(translated => {
//                     post.slug = translated;
//                     translateit(post.content.rendered).then(translated => {
//                         post.content.rendered = translated;
//                         // everything is translated and put into post object. so now save it in mongo
//                         const putpost = new Post({
//                             id: post.id,
//                             title: post.title.rendered,
//                             slug: post.slug,
//                             categories: post.categories,
//                             featuredImage: post.featured_media,
//                             content: post.content.rendered
//                         });
//                         putpost.save().then(savedPost => {
//                             console.log('saved post', savedPost.title);
//                         }).catch(err => {
//                             console.log('error saving post', err);
//                         });
//                     });
//                 });
//             });
//             return new Promise(function (resolve) {
//                 setTimeout(resolve, 20000);
//             });
//         });
//     });
//     promise.then(function () {
//         console.log('Loop finished.');
//     });
// })
//     .catch(function (err) {
//         console.log('error getting posts', err);
//     });
// }
// ---------------------------------------------------------------------
// END OF STEP 1!!!!!!!!!!
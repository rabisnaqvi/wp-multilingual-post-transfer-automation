const mongoose = require("mongoose");

const PostSchema = {
    id: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    featuredImage: {
        type: Number,
        required: true
    },
    categories: {
        type: Array,
        required: true
    }
};

module.exports = mongoose.model("Post", PostSchema);

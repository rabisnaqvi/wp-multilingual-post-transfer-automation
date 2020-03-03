const mongoose = require("mongoose");

const NewMediaSchema = {
    oldid: {
        type: Number,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    title: {
        type: String
    },
    caption: {
        type: String
    },
    alt_text: {
        type: String
    },
    fileName: {
        type: String
    }
};

module.exports = mongoose.model("NewMedia", NewMediaSchema);

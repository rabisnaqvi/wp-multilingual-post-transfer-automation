const mongoose = require("mongoose");

const OldMediaSchema = {
    id: {
        type: Number,
        required: true
    },
    url: {
        type: String,
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
    }
};

module.exports = mongoose.model("OldMedia", OldMediaSchema);

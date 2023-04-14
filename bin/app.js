const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, '../src')));
app.use(express.static(path.join(__dirname, '../example')));
app.use(express.static(path.join(__dirname, '../node_modules')));

module.exports = app;
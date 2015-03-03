var express = require('express');

var app = express();
app.set('port', (process.env.PORT || 5000));

var api = require('./api/api.js');
app.use('/api', api);

var admin = require('./admin/admin.js');
app.use('/admin', admin);

app.listen(app.get('port'));

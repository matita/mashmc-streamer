var fs = require('fs');

module.exports = function(mashmc, route) {

  route
    .get('/:mediaId', function(req, res) {
      var mediaId = req.params.mediaId;
      console.log('streamer. mediaId', mediaId);
      
      mashmc.db.findOne({ _id: mediaId }, function(err, media) {
        if (err)
          return res.status(500).send(err);
        if (!media)
          return res.status(404).send('Media ' + mediaId + ' not found');

        var filePath = media.filepath;
        var stat = fs.statSync(filePath);
        var totalBytes = stat.size;
        var chunkSize = totalBytes;
        var streamRange = {};
        var stream;

        var rangeHeader = req.get('range');
        if (rangeHeader) {
          var range = rangeHeader
            .replace(/^bytes=/, '')
            .split('-');
          
          streamRange.start = +range[0] || 0;
          streamRange.end = +range[1] || totalBytes - 1;
          chunkSize = streamRange.end - streamRange.start + 1;

          res
            .status(206)
            .header({
              'Accept-Ranges': 'bytes',
              'Content-Range': 'bytes ' + streamRange.start + '-' + streamRange.end + '/' + totalBytes,
              'Content-Length': chunkSize
            });
        }

        stream = fs.createReadStream(filePath, streamRange);
        stream.pipe(res.type('video/mp4'));
      })
    });

}
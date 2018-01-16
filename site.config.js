const photos = require('./src/data/photos')
const travels = require('./src/data/travels')

module.exports = {
  site: {
    title: 'Zen and motorcycles',
    description: 'Place for my photos, travel stories, opinions and more',
    photos: photos.data, 
    travels: travels.data
  }
}
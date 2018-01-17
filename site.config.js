const photos = require('./src/data/photos')
const travels = require('./src/data/travels')
const blogs = require('./src/data/blogs')

module.exports = {
  site: {
    title: 'Zen and motorcycles',
    description: 'Place for my photos, travel stories, opinions and more',
    photos: photos.data, 
    travels: travels.data,
    blogs: blogs.data
  }
}
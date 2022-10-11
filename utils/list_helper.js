var _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  var likes = 0
  blogs.forEach((blog) => {
    likes = likes + blog.likes
  })

  return likes
}

const favoriteBlog = (blogs) => {
  var favorite = undefined
  var mostLikes = 0
  blogs.forEach((blog) => {
    if(blog.likes > mostLikes) {
      favorite = blog
      mostLikes = blog.likes
    }
  })

  const mostLikedBlog = {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes
  }

  return mostLikedBlog
}

const mostBlogs = (blogs) => {
  var helperList = []
  blogs.forEach((blog) => {
    var author = blog.author
    var inHelperArray = _.find(helperList, { author: author })

    if(inHelperArray === undefined) {
      helperList.push({ author: author, blogs: 1 })
    } else {
      var index = _.indexOf(helperList, inHelperArray)
      var count = inHelperArray.blogs + 1
      helperList[index] = { author: author, blogs: count }
    }
  })

  var mostBlogsAuthor = {}
  var blogCount = 0

  helperList.forEach((author) => {
    if(author.blogs > blogCount) {
      blogCount = author.blogs
      mostBlogsAuthor = author
    }
  })

  return mostBlogsAuthor
}

const mostLikes = (blogs) => {
  var helperList = []
  blogs.forEach((blog) => {
    var author = blog.author
    var likes = blog.likes

    var inHelperArray = _.find(helperList, { author: author })

    if(inHelperArray === undefined) {
      helperList.push({ author: author, likes: likes })
    } else {
      var index = _.indexOf(helperList, inHelperArray)
      var newLikes = inHelperArray.likes + likes
      helperList[index] = { author: author, likes: newLikes }
    }
  })

  var mostLikesAuthor = {}
  var likeCount = 0

  helperList.forEach((author) => {
    if(author.likes > likeCount) {
      likeCount = author.likes
      mostLikesAuthor = author
    }
  })

  return mostLikesAuthor
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}
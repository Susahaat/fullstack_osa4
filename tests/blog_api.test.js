const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})
  let blogObject = new Blog(helper.initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(helper.initialBlogs[1])
  await blogObject.save()
  blogObject = new Blog(helper.initialBlogs[2])
  await blogObject.save()
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('blogs have id', async () => {
  const response = await api.get('/api/blogs')
  response.body.forEach((blog) => {
    expect(blog.id).toBeDefined()
  })
})

test('a blog can be added', async () => {
  const newBlog = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDatabase()
  const contents = blogsAtEnd.map(blog => blog.title)

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  expect(contents).toContain('Type wars')
})

test('if likes is not defined, assing 0 likes', async() => {
  const newBlog = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  const response = await api.get('/api/blogs')
  let likes
  response.body.map((blog) => {
    if(blog.title === 'Type wars') {
      likes = blog.likes
    }
  })

  expect(likes).toBe(0)
})

test('blog without title or url cannot be added', async() => {
  const newBlogNoUrl = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    likes: 5,
  }

  const newBlogNoTitle = {
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 5,
  }

  const newBlogNoEither = {
    author: 'Robert C. Martin',
    likes: 5,
  }

  await api
    .post('/api/blogs')
    .send(newBlogNoEither)
    .expect(400)

  const response = await helper.blogsInDatabase()
  expect(response).toHaveLength(helper.initialBlogs.length)

  await api
    .post('/api/blogs')
    .send(newBlogNoTitle)
    .expect(400)

  const response2 = await helper.blogsInDatabase()
  expect(response2).toHaveLength(helper.initialBlogs.length)

  await api
    .post('/api/blogs')
    .send(newBlogNoUrl)
    .expect(400)

  const response3 = await helper.blogsInDatabase()
  expect(response3).toHaveLength(helper.initialBlogs.length)
})

test('deleting a blog', async() => {
  const blogsStart = await helper.blogsInDatabase()
  const blogToDelete = blogsStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsEnd = await helper.blogsInDatabase()
  expect(blogsEnd).toHaveLength(helper.initialBlogs.length - 1)

  const titles = blogsEnd.map(blog => blog.title)

  expect(titles).not.toContain(blogToDelete.title)
})

test('updating a blog', async() => {
  const blogsAtStart = await helper.blogsInDatabase()
  const blogToUpdate = blogsAtStart[0]
  blogToUpdate.likes = 100

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(blogToUpdate)
    .expect(200)

  const blogsEnd = await helper.blogsInDatabase()
  let isInArray = false
  blogsEnd.forEach((blog) => {
    if (blog.id === blogToUpdate.id && blog.likes === blogToUpdate.likes) {
      isInArray = true
    }
  })

  expect(isInArray).toBe(true)
})

afterAll(() => {
  mongoose.connection.close()
})
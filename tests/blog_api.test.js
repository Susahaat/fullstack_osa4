const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('when there is initially some blogs saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
    await User.deleteMany({})
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
    const token = await helper.loggedInUserToken()
    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 2,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set({ Authorization: 'bearer ' + token })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDatabase()
    const contents = blogsAtEnd.map(blog => blog.title)

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(contents).toContain('Type wars')
  })

  test('deleting a blog', async() => {
    const token = await helper.loggedInUserToken()
    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 2,
    }

    const blogToDelete = await api
      .post('/api/blogs')
      .send(newBlog)
      .set({ Authorization: 'bearer ' + token })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    await api
      .delete(`/api/blogs/${blogToDelete.body.id}`)
      .set({ Authorization: 'bearer ' + token })
      .expect(204)

    const blogsEnd = await helper.blogsInDatabase()
    expect(blogsEnd).toHaveLength(helper.initialBlogs.length)

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
})

describe('adding one blog', () => {
  beforeEach(async () => {
    await User.deleteMany({})
  })
  test('if likes is not defined, assing 0 likes', async() => {
    const token = await helper.loggedInUserToken()
    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set({ Authorization: 'bearer ' + token })
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
    const token = await helper.loggedInUserToken()
    const blogsAtStart = await helper.blogsInDatabase()

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
      .set({ Authorization: 'bearer ' + token })
      .expect(400)

    const response = await helper.blogsInDatabase()
    expect(response).toHaveLength(blogsAtStart.length)

    await api
      .post('/api/blogs')
      .send(newBlogNoTitle)
      .set({ Authorization: 'bearer ' + token })
      .expect(400)

    const response2 = await helper.blogsInDatabase()
    expect(response2).toHaveLength(blogsAtStart.length)

    await api
      .post('/api/blogs')
      .send(newBlogNoUrl)
      .set({ Authorization: 'bearer ' + token })
      .expect(400)

    const response3 = await helper.blogsInDatabase()
    expect(response3).toHaveLength(blogsAtStart.length)
  })

  test('cannot add blog if there is no token', async () => {
    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    }

    const response = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)

    expect(response.body.error).toContain('invalid token')
  })
})

describe('when there is initially one user at database', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('salis', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creating with new username', async () => {
    const usersStart = await helper.usersInDatabase()

    const newUser = {
      username: 'susahaat',
      name: 'Susanna Haataja',
      password: 'salasana'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersEnd = await helper.usersInDatabase()
    expect(usersEnd).toHaveLength(usersStart.length + 1)

    const usernames = usersEnd.map(user => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails if username already taken', async () => {
    const usersStart = await helper.usersInDatabase()

    const newUser = {
      username: 'root',
      name: 'Jokunen',
      password: 'joku',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('username must be unique')

    const usersEnd = await helper.usersInDatabase()
    expect(usersEnd).toHaveLength(usersStart.length)
  })
})

describe('adding user', () => {
  test('fails if there is no password', async () => {
    const newUser = {
      username: 'testi',
      name: 'Testi',
      password: '',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('there must be a password')
  })

  test('fails if there is no username', async () => {
    const newUser = {
      name: 'jokunen',
      password: 'hei',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('User validation failed')
  })

  test('fails if username or password is under 3 characters long', async () => {
    const newUser = {
      username: 'testi',
      name: 'Testi',
      password: 'ab',
    }

    const newUser2 = {
      username: 'te',
      name: 'Testi',
      password: 'testi',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password must be atleast 3 characters long')

    const result2 = await api
      .post('/api/users')
      .send(newUser2)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result2.body.error).toContain('User validation failed')
  })
})

afterAll(() => {
  mongoose.connection.close()
})
const { getUserByEmail, generateRandomString } = require('./helpers')
const express = require("express");
const methodOverride = require('method-override')
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'))
app.use(cookieSession({
  name: 'session',
  keys: ['This is test for the key!']
}));

app.set("view engine", "ejs");

const database = {
  aaa123: {
    id: 'aaa123',
    email: "a@a.com",
    password: "123"
  },
  bbb456: {
    id: "bbb456",
    email: "z@z.com",
    password: "abc"
  }
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

app.get("/urls/new", (req, res) => {
  const user = database[req.session.user_id];
  if (user) {
    const templateVars = {
      user: database[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/urls')
  }
});

app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: database[req.session.user_id]
  };
  res.render("urls_register", templateVars);
});
// post_create every session handler
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("Email/Password cannot be empty.");
  }
  const user = getUserByEmail(email, database);
  if (user) {
    return res.status(400).send('An user with that email already exists!');
  }

  const id = generateRandomString();
  database[id] = {
    id: id,
    email: email,
    password: hashedPassword
  }
  req.session.user_id = id;
  res.redirect('/urls')
})

app.post("/urls", (req, res) => {
  const user = database[req.session.user_id];
  if (user) {
    const randStr = generateRandomString();
    urlDatabase[randStr] = {
      longURL: req.body.longURL,
      userID: user.id
    }
    res.redirect(`/urls/${randStr}`);
  } else {
    res.status(400).send("Please login first!");
  }
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  const user = database[req.session.user_id];
  if (!user) {
    return res.status(400).send('Login first');
  }
  if (urlDatabase[req.params.shortURL].userID === user.id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(401).send('You dont own this page');
  }
});

app.put("/urls/:id", (req, res) => {
  const user = database[req.session.user_id];
  if (!user) {
    return res.status(400).send('Login first');
  }
  if (urlDatabase[req.params.id].userID === user.id) {
    urlDatabase[req.params.id] = {
      longURL: req.body.longURL,
      userID: user.id
    };
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.status(401).send('You dont own this page');
  }
});

app.get('/login', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: database[req.session.user_id]
  };
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, database);

  if (!email || !password) {
    return res.status(400).send("Email/Password cannot be empty.");
  }

  if (!user) {
    return res.status(403).send('User with that email Does not exists!');
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Your password doesnt match!');
  }

  req.session.user_id = user.id;
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  delete req.session.user_id;
  res.redirect('/urls');
})

app.get("/urls", (req, res) => {
  const user = database[req.session.user_id];
  if (user) {
    const templateVars = {
      urls: urlsForUser(user.id),
      user: database[req.session.user_id]
    };
    res.render("urls_index", templateVars);
  } else {
    res.render('error_login', { user });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const user = database[req.session.user_id];
  if (!user) {
    return res.status(400).send('Login first');
  }
  if (urlDatabase[req.params.shortURL].userID === user.id) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: database[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.render('error_login', { user });
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send('Short URL not found!');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlsForUser = (uid) => {
  const subset = {};
  for (const id in urlDatabase) {
    if (urlDatabase[id].userID === uid) {
      subset[id] = urlDatabase[id];
    }
  }
  return subset;
}
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.set("view engine", "ejs");

const users = {
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
}

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
  const user = users[req.cookies.user_id];
  if (user) {
    const templateVars = { user: users[req.cookies.user_id] }
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/urls')
  }
});

app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("Email/Password cannot be empty.");
  }
  const user = findUserByEmail(email);
  if (user) {
    return res.status(400).send('An user with that email already exists!');
  }

  const id = generateRandomString();
  users[id] = {
    id: id,
    email: email,
    password: hashedPassword
  }
  res.cookie('user_id', id);
  res.redirect('/urls')
})

app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const user = users[req.cookies.user_id];
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

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.cookies.user_id];
  if (!user) {
    return res.status(400).send('Login first');
  }
  if (urlDatabase[req.params.shortURL].userID === user.id) {
    console.log(req.params.shortURL)
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(401).send('You dont own this page');
  }
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.cookies.user_id];
  if (!user) {
    return res.status(400).send('Login first');
  }
  if (urlDatabase[req.params.id].userID === user.id) {
    urlDatabase[req.params.id] = {
      longURL: req.body.longURL,
      userID: user.id
    };
    res.redirect(`/urls/${req.params.id}`)
  } else {
    res.status(401).send('You dont own this page');
  }
});

app.get('/login', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);

  if (!email || !password) {
    return res.status(400).send("Email/Password cannot be empty.");
  }

  if (!user) {
    return res.status(403).send('User with that email Does not exists!');
  }

  if (!bcrypt.compareSync( password , user.password)) {
    return res.status(403).send('Your password doesnt match!');
  }

  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user) {
    const templateVars = {
      urls: urlsForUser(user.id),
      user: users[req.cookies.user_id]
    };
    res.render("urls_index", templateVars);
  } else {
    res.render('error_login', { user });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies.user_id];
  if (!user) {
    return res.status(400).send('Login first');
  }
  console.log(req.params.shortURL)
  if (urlDatabase[req.params.shortURL].userID === user.id) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.cookies.user_id]
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


function generateRandomString() {
  const str = 'abcdefghigklmnopqrstuvhxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomStr = '';
  while (randomStr.length < 6) {
    let ranNum = Math.floor(Math.random() * str.length)
    randomStr += str[ranNum];
  }
  return randomStr;
}

const findUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

const urlsForUser = (pid) => {
  const subset = {};
  for (const id in urlDatabase) {
    if (urlDatabase[id].userID === pid) {
      subset[id] = urlDatabase[id];
    }
  }
  return subset;
}

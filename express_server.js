const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] }
  res.render("urls_new", templateVars);
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

  if(!email || !password){
    return res.status(400).send("Email/Password cannot be empty.");
  }
  const user = findUserByEmail(email);
  if(user) {
    return res.status(400).send('An user with that email already exists!');
  }

  const id = generateRandomString();
  users[id] = {
    id: id,
    email: email,
    password: password
  }
  res.cookie('user_id', id);
  res.redirect('/urls')
})

app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const randStr = generateRandomString();
  urlDatabase[randStr] = req.body.longURL;
  res.redirect(`/urls/${randStr}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  // console.log(req.params)
  // console.log(req.body)
  res.redirect(`/urls/${req.params.id}`)
});

app.get('/login', (req, res)=>{
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password){
    return res.status(400).send("Email/Password cannot be empty.");
  }
  const user = findUserByEmail(email);

  if(!user) {
    return res.status(403).send('User with that email Does not exists!');
  }
  if (user.password !== password ){
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
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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
  for(const userId in users) {
    const user = users[userId];
    if(user.email === email) {
      return user;
    }
  }
  return null;
}

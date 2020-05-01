module.exports = (app) => {
  const express = require("express");
  const jwt = require("jsonwebtoken");
  const assert = require('http-assert')
  const Admin = require("../../models/Admin");

  const router = express.Router({
    mergeParams: true,
  });

const auth =async (req,res,next)=>{
  const token =String(req.headers.authorization || '').split(' ')[1];
  assert(token,401,'需要登录')
  const {id} = jwt.verify(token,req.app.get('SECRET'));
  assert(id,401,'登录信息失效，请重新登录')
  req.user = await Admin.findById(id)
  assert(req.user,401,'登录信息有误')
  await next();
};

const handleModelName =async (req, res, next) => {
  const modelName = require("inflection").classify(req.params.resource);
  req.Model = require(`../../models/${modelName}`);
  await next();
}

  router.post("/", async (req, res) => {
    const data = await req.Model.create(req.body);
    res.send(data);
  });

  router.get("/", async (req, res) => {
    const queryOptions = {};
    if (req.Model.modelName == "Category") {
      queryOptions.populate = "parent";
    }
    if (req.Model.modelName == "Article") {
      queryOptions.populate = "categories";
    }
    const data = await req.Model.find().setOptions(queryOptions).limit(10);
    res.send(data);
  });

  router.get("/:id", async (req, res) => {
    const data = await req.Model.findById(req.params.id);
    res.send(data);
  });

  router.put("/:id", async (req, res) => {
    const data = await req.Model.findByIdAndUpdate(req.params.id, req.body);
    res.send(data);
  });

  router.delete("/:id", async (req, res) => {
    const data = await req.Model.findByIdAndRemove(req.params.id);
    res.send(data);
  });

  app.use(
    "/admin/api/rest/:resource",auth,handleModelName,
    router
  );

  const multer = require("multer");
  const upload = multer({ dest: __dirname + "/../../uploads" });
  app.post("/admin/api/upload", upload.single("file"), async (req, res) => {
    const file = req.file;
    file.url = `http://localhost:3000/uploads/${file.filename}`;
    res.send(file);
  });

  app.post("/admin/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await Admin.findOne({ username }).select("+password"); //使可以取到password
    if (!user) {
      return res.status(422).send({
        message: "用户名不存在！",
      });
    }
    const isValid = require("bcrypt").compareSync(password, user.password);
    if (!isValid) {
      return res.status(422).send({
        message: "密码输入错误！",
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
      },
      app.get("SECRET")
    );
    res.send({
      token
    });
  });

  app.use(async(err,req,res,next)=>{
    res.status(err.statusCode || 500).send({
      message:err.message
    })
  })
};

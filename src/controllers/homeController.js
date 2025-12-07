import db from "../models/index.js";
import {
  createNewUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
} from "../services/CRUDService.js";

let getHomePage = async (req, res) => {
  try {
    let data = await db.User.findAll();
    // console.log(">>> Check data: ", data);
    return res.render("homepage.ejs", { users: JSON.stringify(data) });
  } catch (error) {
    console.log(error);
  }
};

let getCRUDPage = (req, res) => {
  return res.render("crud.ejs");
};

let postCRUD = async (req, res) => {
  let message = await createNewUser(req.body);
  console.log(message);
  return res.send("Post crud from server");
};

let displayCRUD = async (req, res) => {
  let data = await getAllUsers();
  console.log(">>> Check data: ", data);
  console.log(">>> Check data length: ", data.length);
  return res.render("displayCRUD.ejs", { dataTable: data });
};

let editCRUD = async (req, res) => {
  let userId = req.query.id;
  console.log(">>> Check userId from controller: ", userId);
  if (userId) {
    let userData = await getUserById(userId);
    console.log(">>> Check userData from controller: ", userData);
    return res.render("editCRUD.ejs", { user: userData });
  }
};

let deleteCRUD = async (req, res) => {
  let userId = req.query.id;
  console.log(">>> Check userId from controller: ", userId);
  if (userId) {
    await deleteUser(userId);
    return res.send("Delete the user succeed!");
  }
  return res.send("User not found!");
};

let putCRUD = async (req, res) => {
  let data = req.body;
  let allUsers = await updateUser(data);
  return res.render("displayCRUD.ejs", { dataTable: allUsers });
};

module.exports = {
  getHomePage,
  getCRUDPage,
  postCRUD,
  displayCRUD,
  editCRUD,
  deleteCRUD,
  putCRUD,
};

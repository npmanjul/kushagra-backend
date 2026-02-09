import contact from "../model/Contact.model.js";

const contactUs = async (req, res) => {
  try {
    const { name, phone_number, email, message } = req.body;

    if (!name || !phone_number || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await contact.create({
      name,
      phone_number,
      email,
      message,
    });

    return res
      .status(200)
      .json({ message: "Contact form submitted successfully" });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const GetAllContacts = async (req, res) => {
  try {
    const contacts = await contact.find({}).lean();

    if (!contacts.length) {
      return res.status(200).json({
        message: "No contacts found",
        contacts: [],
      });
    }

    return res.status(200).json({
      message: "Contacts fetched successfully",
      contacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  contactUs,
  GetAllContacts,
};

import fs from "fs";

const generatePayload = async () => {
  const imagePath = "path/to/your/image.jpg";
  const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });

  const jsonPayload = {
    title: "My First Task",
    description: "This is a sample task with an image.",
    type: "Task Type",
    is_completed: false,
    task_image: base64Image,
    task_image_type: "image/jpeg", 
  };

  console.log(JSON.stringify(jsonPayload, null, 2)); // Print JSON payload for Postman
};

generatePayload();
// Test script for Getform.io form submission
// Run this in the browser console on your contact page

async function testFormSubmission() {
  console.log("🧪 Testing Getform.io form submission...");

  try {
    // Create test form data
    const formData = new FormData();
    formData.append("name", "Test User");
    formData.append("email", "test@example.com");
    formData.append(
      "message",
      "This is a test submission from the browser console"
    );
    formData.append("subject", "Test Contact Form Submission from Portfolio");

    // Submit to Getform.io
    const response = await fetch("https://getform.io/f/aejemjdb", {
      method: "POST",
      body: formData,
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response ok:", response.ok);

    if (response.ok) {
      console.log("✅ Form submission successful!");
      console.log("📧 Check your Getform.io dashboard for the test submission");
    } else {
      console.log("❌ Form submission failed");
      const errorText = await response.text();
      console.log("Error details:", errorText);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testFormSubmission();

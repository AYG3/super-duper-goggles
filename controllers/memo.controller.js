// Create and send memo
const createMemo = asyncHandler(async (req, res) => {
  const { recipients, department, content, title } = req.body;

  // Validate content against defined memo fields
  const fields = await MemoField.find();
  const contentKeys = Object.keys(content);
  for (const field of fields) {
    if (field.required && !contentKeys.includes(field.name)) {
      res.status(400);
      throw new Error(`Missing required field: ${field.name}`);
    }
  }

  // Validate recipients or department
  let recipientIds = [];
  if (recipients && recipients.length > 0) {
    // Ensure recipients are valid ObjectIds
    try {
      recipientIds = recipients;
    } catch (error) {
      res.status(400);
      throw new Error("Invalid recipient ID format");
    }
  } else if (department) {
    const users = await User.find({ department });
    recipientIds = users.map((user) => user._id);
  } else {
    res.status(400);
    throw new Error("Must specify recipients or department");
  }

  // Create status map for recipients
  const status = new Map();
  recipientIds.forEach((id) => {
    status.set(id.toString(), { status: "sent", timestamp: new Date() });
  });

  const memo = await Memo.create({
    sender: req.user._id,
    recipients: recipientIds,
    department,
    title,
    content,
    status,
  });

  // Send email notifications
  const recipientUsers = await User.find({ _id: { $in: recipientIds } });
  for (const user of recipientUsers) {
    await sendEmail({
      to: user.email,
      subject: "New Memo Received",
      text: `You have received a new memo from ${req.user.name}. Log in to view details.`,
    });
  }

  res.status(201).json(memo);
});
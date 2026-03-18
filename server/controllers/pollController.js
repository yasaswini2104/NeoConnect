import Poll from '../models/Poll.js';

// POST /api/polls
export const createPoll = async (req, res) => {
  try {
    const { question, options, endsAt } = req.body;

    const poll = await Poll.create({
      question,
      options: options.map((text) => ({ text, votes: [] })),
      createdBy: req.user._id,
      endsAt: endsAt ? new Date(endsAt) : undefined,
    });

    res.status(201).json({ poll });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/polls
export const getPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ polls });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/polls/:id/vote
export const castVote = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll || !poll.isActive) {
      return res.status(400).json({ message: 'Poll not found or closed' });
    }

    const alreadyVoted = poll.options.some((opt) =>
      opt.votes.some((v) => v.toString() === req.user._id.toString())
    );
    if (alreadyVoted) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option index' });
    }

    poll.options[optionIndex].votes.push(req.user._id);
    await poll.save();

    res.json({ poll });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/polls/:id/close
export const closePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { returnDocument: 'after' }
    );
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json({ poll });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

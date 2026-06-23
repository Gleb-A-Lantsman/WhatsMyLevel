/**
 * data.js
 * -----------------------------------------------------------------------
 * All test CONTENT lives here, separate from the app logic in app.js.
 * This is the file to edit when you want to add the Listening questions,
 * change a Reading passage, or add more Speaking prompts — nothing in
 * here needs to touch app.js or styles.css.
 *
 * NOTE on the Reading passages below: they are original content written
 * for RE-Academy, in the same format/difficulty as the reference test
 * (a 6-statement matching task, an 8-question single-passage task, and a
 * 10-question email task) — not copied from any third-party test.
 * -----------------------------------------------------------------------
 */

const TEST_DATA = {

  // ===================================================================
  // BREAK — optional rest period offered between sections (Reading→
  // Listening, Listening→Speaking). Students can wait it out or skip
  // straight to the next section. Change the number below to adjust
  // how long the break lasts.
  // ===================================================================
  breakSeconds: 5 * 60,

  // ===================================================================
  // AUDIO CHECK — plays once before the test starts, on the audio
  // check screen. Drop the converted file at this path (alongside the
  // Listening audio) — same folder, same naming convention.
  // ===================================================================
  audioCheck: {
    audioUrl: 'audio/audio-check.mp3'
  },

  // ===================================================================
  // READING — 25 minutes, 4 tasks
  // ===================================================================
  reading: {
    durationSeconds: 25 * 60,
    tasks: [

// --- Task 0: vocabulary-in-context, 6 sentences, 4 options each ---
{
  id: 'r0',
  type: 'single4',
  partLabel: 'Part 1',
  instructions: 'You will read 6 sentences. Choose the word or phrase that best completes each sentence.',
  passages: [],
  questions: [
    { id: 'r0q1', text: 'The plane finally arrived after a ______ of three hours.', options: ['slowing', 'stall', 'halt', 'delay'], answer: 3 },
    { id: 'r0q2', text: 'Appliances and electronics are sold on the second ______.', options: ['landing', 'stage', 'floor', 'base'], answer: 2 },
    { id: 'r0q3', text: 'Jennifer said she would ______ her son to play online games if he got low marks on his report card.', options: ['prevent', 'forbid', 'deny', 'exclude'], answer: 1 },
    { id: 'r0q4', text: 'A notable ______ of the symposium was the speech by a famous entrepreneur.', options: ['feature', 'attention', 'headline', 'emphasis'], answer: 0 },
    { id: 'r0q5', text: 'You have been an ______ help since I moved out here a few months ago.', options: ['intense', 'infinite', 'excessive', 'enormous'], answer: 3 },
    { id: 'r0q6', text: 'The black rhinoceros is listed as a critically ______ species.', options: ['endangered', 'dangerous', 'exposed', 'weak'], answer: 0 }
  ]
},

// --- Task 1: matching task (Passage A / Passage B / Both) ------
{
  id: 'r1',
  type: 'match3',
  instructions: 'Read both passages and the 6 statements. Decide if each statement is supported by:',
  instructionList: ['Passage A', 'Passage B', 'Both Passages'],
  passages: [
    {
      label: 'Passage A',
      title: 'The Notting Hill Carnival',
      text: `The Notting Hill Carnival is one of the world's largest street festivals. It is held in the Notting Hill area of West London. Over one million people attend the carnival, which takes place over three days every August. The event started in 1966 as a celebration of Caribbean culture, with people from the West Indies, who had immigrated to London, organizing the festival. Nowadays, the event is very multi-cultural and people from all the different communities of London come together at the festival. However, the music, costumes, floats and food still have a strong Caribbean influence.`
    },
    {
      label: 'Passage B',
      title: 'The Rio de Janeiro Carnival',
      text: `The Rio de Janeiro Carnival is the biggest and most famous street festival in the world. It is held annually in the Brazilian city, over six days before the Christian festival of Lent. On each day, over two million people come out on to the streets of Rio to dance and play music. There are competitions between the different samba schools, with each school trying to have the best float, costume and music, as well as to be the best at samba dancing. These days, some of the main events are ticketed and held in stadiums.`
    }
  ],
  options: ['Passage A', 'Passage B', 'Both Passages'],
  questions: [
    { id: 'r1q1', text: 'The passage explains how the carnival started.', answer: 'Passage A' },
    { id: 'r1q2', text: 'The passage says how often the carnival is held.', answer: 'Both Passages' },
    { id: 'r1q3', text: 'The passage suggests what is available to eat at the carnival.', answer: 'Passage A' },
    { id: 'r1q4', text: 'The passage says that people have to pay for parts of the carnival.', answer: 'Passage B' },
    { id: 'r1q5', text: 'The passage describes what people see and do at the carnival.', answer: 'Both Passages' },
    { id: 'r1q6', text: 'The passage explains where the festival is held.', answer: 'Both Passages' }
  ]
},

// --- Task 2: single passage, 8 questions -------------------------
{
  id: 'r2',
  type: 'single4',
  instructions: 'Read the passage about a hotel and choose the best answer for each question. There are 8 questions.',
  passages: [
    {
      label: null,
      title: 'Laruna Hotel',
      text: `This is a wonderful resort if you’re looking to get away for a week or two. This large hotel has over 400 rooms, many with a view of the ocean. If you want golden sand and fun in the sea then this is the resort for you. The hotel price includes Jet Skiing, waterskiing and swimming. You can even try sailing (additional costs apply).

Other than water sports, there is plenty to do. There is a tennis court with a gym next to it in the local village. The city is only 10 miles away, where you can go shopping. In addition, the hotel can organize a day trip into the mountains. If you just want to relax, there is a massage room.

A breakfast buffet is served by the swimming pool every morning. For lunch and dinner, the hotel has a great restaurant that looks out over the sea. In the evening they serve freshly grilled seafood. The prices are expensive but the quality is very good. The menu is mostly seafood but they do have other options.

Two nights a week there is live music after dinner. The hotel has a schedule of local bands who play dance music and even offer samba and rhumba lessons for hotel guests. Many visitors say this is a favorite feature of their hotel stay.

This hotel offers free transfer from the airport.`
    }
  ],
  questions: [
    { id: 'r2q1', text: 'This passage is most likely from', options: ['a travel brochure.', 'an email about a vacation.', 'a map of an island.', 'an article about hotel food.'], answer: 0 },
    { id: 'r2q2', text: 'What is the main purpose of the passage?', options: ['To compare the Laruna Hotel to other hotels in the area', 'To describe what the Laruna Hotel offers its guests', 'To report on what past guests think of the Laruna Hotel', 'To present what the author thinks is best about the Laruna Hotel'], answer: 1 },
    { id: 'r2q3', text: 'Which of the following is a feature at the Laruna Hotel?', options: ['A tennis court', 'Shops', 'A massage room', 'A gym'], answer: 2 },
    { id: 'r2q4', text: 'According to the passage, the Laruna Hotel restaurant is', options: ['over-priced.', 'cheap.', 'poor quality.', 'good value.'], answer: 3 },
    { id: 'r2q5', text: 'What must guests at the Laruna Hotel pay extra for?', options: ['Waterskiing', 'Jet Skiing', 'Swimming', 'Sailing'], answer: 3 },
    { id: 'r2q6', text: 'Which of the following is a favorite experience of many Laruna Hotel guests?', options: ['Going to the beach', 'Spending a day in the mountains', 'Taking Latin dance classes', 'Going shopping in the city'], answer: 2 },
    { id: 'r2q7', text: 'Which description best fits the Laruna Hotel?', options: ['A place designed to make families with young children comfortable', 'A vacation that includes the beach and some taste of local culture', 'A hotel especially suited to people who love to hike in rugged landscapes', 'A trip for those who especially like night life'], answer: 1 },
    { id: 'r2q8', text: 'Which of the facts does the passage tell you about the Laruna Hotel?', options: ['The country where it is located', 'The language the people there speak', 'The number of rooms in the hotel', 'The distance from the hotel to the beach'], answer: 2 }
  ]
},


// --- Task 3: email passage, 10 questions -------------------------
{
  id: 'r3',
  type: 'single4',
  instructions: 'Read the email about a birthday party and choose the best answer for each question. There are 10 questions.',
  passages: [
    {
      label: null,
      title: null,
      text: `My dear friends,

Thank you SO much for coming to my birthday party yesterday! I had such a good time with you all. Patrick, thanks for being the grill master – the meat was delicious. And thanks to Nikki for preparing all those salads. They were so tasty – especially the green salad with grilled vegetables. And Tom and Claire, thanks for lending us your inflatable swimming pool – the children loved it, especially because it was such a hot day.

I also love all of my gifts. The hat is perfect; I love the color. And the earrings are gorgeous. I will wear them tonight at the restaurant. I'm sure my mum will love them, too.

And by the way, Peter, you forgot your sunglasses at my house, but don’t worry, I’ll bring them to the office tomorrow.

Thanks again to all of you! Enjoy the rest of your Sunday.

Lots of love,

Helen`
    }
  ],
  questions: [
    { id: 'r3q1', text: 'When is Helen’s birthday?', options: ['Spring', 'Summer', 'Autumn', 'Winter'], answer: 1 },
    { id: 'r3q2', text: 'Who cooked the meat?', options: ['Tom', 'Nikki', 'Claire', 'Patrick'], answer: 3 },
    { id: 'r3q3', text: 'Where was the party?', options: ['In a flat', 'In an office', 'In a garden', 'In a restaurant'], answer: 2 },
    { id: 'r3q4', text: 'Which present did Helen get?', options: ['Something to wear around her neck', 'Something to wear on her hands', 'Something to wear on her head', 'Something to wear on her feet'], answer: 2 },
    { id: 'r3q5', text: 'Where is Helen going in the evening?', options: ['To a restaurant', 'To Peter’s house', 'To a swimming pool', 'To her mother’s house'], answer: 0 },
    { id: 'r3q6', text: 'What will Helen’s mother like?', options: ['Helen’s shoes', 'Helen’s clothes', 'Helen’s jewelry', 'Helen’s handbag'], answer: 2 },
    { id: 'r3q7', text: 'Why did Helen mention Peter in the email?', options: ['To thank him for a pair of sunglasses', 'To ask him to bring her sunglasses to the office', 'To remind him to bring something to her house', 'To tell him he left something at the party'], answer: 3 },
    { id: 'r3q8', text: 'Who is Peter?', options: ['Helen’s brother', 'Helen’s husband', 'Helen’s colleague', 'Helen’s boyfriend'], answer: 2 },
    { id: 'r3q9', text: 'Which day was the party?', options: ['Friday', 'Saturday', 'Sunday', 'Monday'], answer: 1 },
    { id: 'r3q10', text: 'What is Helen’s email mainly about?', options: ['Thanking people for going to her party', 'Thanking people for helping her', 'Thanking people for visiting her', 'Thanking people for a special present'], answer: 0 }
  ]
},

  // ===================================================================
  // LISTENING — 25 minutes, 3 tasks.
  //
  // Each task needs an audio file at the path in `audioUrl`. Drop your
  // converted mp3 files into an `audio/` folder next to index.html,
  // named exactly:
  //   audio/listening-1.mp3
  //   audio/listening-2.mp3
  //   audio/listening-3.mp3
  // (or change the paths below to match whatever you name them).
  // ===================================================================
  listening: {
    durationSeconds: 25 * 60,
    tasks: [
{
  id: 'l1',
  audioUrl: 'audio/listening-1.mp3',
  instructions: 'You will hear ten speakers. Each speaker will make a statement or ask a question. For each speaker, choose the best option for what comes next. You can play the recording {{TWO}} times.',
  headerStyle: 'full', // "What is the best response to Speaker N?"
  questions: [
    { id: 'l1q1', speaker: 1, line: 'Where are my keys?', options: ['I can’t open the door.', 'I’ll fix them.', 'Here is the lock.', 'They’re in the kitchen.'], answer: 3 },
    { id: 'l1q2', speaker: 2, line: 'I\'ve got a cold.', options: ['I hope you feel better soon.', 'I’d love a glass of water.', 'Why don’t you put on a jumper?', 'Has the temperature changed?'], answer: 0 },
    { id: 'l1q3', speaker: 3, line: 'Can you make lunch today?', options: ['I’ll have a sandwich, thanks.', 'Yes, what would you like?', 'No, not yet.', 'Will you be coming home later?'], answer: 1 },
    { id: 'l1q4', speaker: 4, line: 'She isn\'t here yet.', options: ['She decided to take the train.', 'By the clock tower.', 'I’ll see her tomorrow.', 'She said she would be here in five minutes.'], answer: 3 },
    { id: 'l1q5', speaker: 5, line: 'What does he do?', options: ['He dropped his phone.', 'He lives in Manchester.', 'He’s an architect.', 'He studied engineering.'], answer: 2 },
    { id: 'l1q6', speaker: 6, line: 'They\'ve just moved house.', options: ['Where to?', 'Do you need some help?', 'Here’s my address.', 'They’ve lived there for 10 years.'], answer: 0 },
    { id: 'l1q7', speaker: 7, line: 'I\'m going to bed.', options: ['Did the alarm go off?', 'Where is it?', 'Good night.', 'You looked tired yesterday.'], answer: 2 },
    { id: 'l1q8', speaker: 8, line: 'Can I borrow a pen?', options: ['I prefer to type my notes.', 'Yes, here you are.', 'This pen was on sale.', 'I lent it to you.'], answer: 1 },
    { id: 'l1q9', speaker: 9, line: 'Could that be the dog you saw last week?', options: ['I prefer small dogs if they don’t bark too much.', 'I remembered that dog after you pointed her out.', 'I thought we were in a different part of the park.', 'I don’t think so because it is so much bigger.'], answer: 3 },
    { id: 'l1q10', speaker: 10, line: 'How much will it be to send this parcel to the USA?', options: ['It depends on how soon you want it to get there.', 'It will take a minimum of two weeks.', 'If it weighs more than 2 kilos you must sign here.', 'The box will have to be securely taped.'], answer: 0 }
  ]
},
{
  id: 'l2',
  audioUrl: 'audio/listening-2.mp3',
  instructions: 'You will hear ten speakers. Each speaker will make a statement or ask a question. For each speaker, choose the best option for what comes next. You can play the recording {{TWO}} times.',
  headerStyle: 'full',
  questions: [
    { id: 'l2q1', speaker: 1, line: 'Do you like playing football?', options: ['I go to school every day.', 'Yes, he does.', 'No, I think golf is better.', 'No, she prefers swimming.'], answer: 2 },
    { id: 'l2q2', speaker: 2, line: 'Where do you work?', options: ['I\'m an engineer.', 'I travel in the summer.', 'I studied finance.', 'I commute to the city.'], answer: 0 },
    { id: 'l2q3', speaker: 3, line: 'I have a cold.', options: ['Do you want a jacket?', 'Would you like to go to the park?', 'Do you want to visit a doctor?', 'Didn’t you know it was cold outside?'], answer: 2 },
    { id: 'l2q4', speaker: 4, line: 'I try to take a walk every day.', options: ['Do you avoid the bus?', 'Are you near a train station?', 'How often do you do it?', 'How long does it take?'], answer: 3 },
    { id: 'l2q5', speaker: 5, line: 'Here is my Aunt Emily now.', options: ['Is she your dad\'s sister?', 'Where is your uncle?', 'She and I are sisters.', 'I haven’t seen my niece for a long time.'], answer: 0 },
    { id: 'l2q6', speaker: 6, line: 'Why did Michael turn down that job offer?', options: ['He wanted to make more money.', 'He preferred a different plan.', 'He was tired of studying.', 'He went there last year.'], answer: 0 },
    { id: 'l2q7', speaker: 7, line: 'Can you break down that process so I can understand it better?', options: ['It has often been presented.', 'It would take very little work.', 'There are basically five critical steps.', 'There is no point in going further.'], answer: 2 },
    { id: 'l2q8', speaker: 8, line: 'That professor really knows how to get a point across to students.', options: ['Where did you study before?', 'Can you give me an example?', 'Do you think the students work hard enough?', 'Does he teach more than one class?'], answer: 1 },
    { id: 'l2q9', speaker: 9, line: 'Sally let the team down when she skipped the practice.', options: ['They won that game.', 'There was nothing the coach could do.', 'Was the practice longer than usual?', 'Didn’t they know she was sick?'], answer: 3 },
    { id: 'l2q10', speaker: 10, line: 'If she were here, I know she would advise us to just put up with the delays.', options: ['She often wanted to beat the deadlines.', 'She was always in favor of a patient approach.', 'She was the one who said we should set something up.', 'She tore up more than one contract over timing.'], answer: 1 }
  ]
},
{
  id: 'l3',
  audioUrl: 'audio/listening-3.mp3',
  instructions: 'You will hear ten speakers. Each speaker will make a statement or ask a question. For each speaker, choose the best option for what comes next. You can play the recording {{TWO}} times.',
  headerStyle: 'short', // just "Speaker N"
  questions: [
    { id: 'l3q1', speaker: 1, line: 'I finished my book yesterday.', options: ['What class did you go to?', 'Can you do your homework?', 'Was it good?'], answer: 2 },
    { id: 'l3q2', speaker: 2, line: 'I live in Australia.', options: ['My wife is also Austrian.', 'I went there on holiday.', 'When do you move there?'], answer: 1 },
    { id: 'l3q3', speaker: 3, line: 'Would you like a cup of tea?', options: ['Yes please, with milk.', 'I’m going to a café.', 'I prefer to have lunch later.'], answer: 0 },
    { id: 'l3q4', speaker: 4, line: 'This is my new Irish wool sweater.', options: ['That’ll be £15, please.', 'It is really lovely.', 'That’s great for summer.'], answer: 1 },
    { id: 'l3q5', speaker: 5, line: 'What time is it?', options: ['It’s half past nine.', 'It’s ten degrees.', 'It’s the number eleven.'], answer: 0 },
    { id: 'l3q6', speaker: 6, line: 'I\'m going to play pool.', options: ['Can you swim?', 'I like the rides.', 'When are you going?'], answer: 2 },
    { id: 'l3q7', speaker: 7, line: 'This class is not very interesting.', options: ['Yes, I’m so boring.', 'Yes, I hope it finishes soon.', 'Yes, I’m learning a lot.'], answer: 1 },
    { id: 'l3q8', speaker: 8, line: 'Shall we buy some jewellery for Mum?', options: ['I saw a lovely necklace yesterday.', 'These are too big for her.', 'She won’t like the color.'], answer: 0 },
    { id: 'l3q9', speaker: 9, line: 'I am so happy that I\'m finally here.', options: ['Yes, it was a long journey.', 'Yes, it was a really fast trip.', 'Yes, it has finally arrived.'], answer: 0 },
    { id: 'l3q10', speaker: 10, line: 'Who looks after the children?', options: ['They look like their father.', 'I saw them yesterday.', 'My mother does.'], answer: 2 }
  ]
}
    ]
  },

  // ===================================================================
  // SPEAKING — matches the real IELTS Speaking format: each question
  // plays its own video automatically, then a 5-second countdown, then
  // (Part 2 only) a 1-minute prep, then recording starts automatically.
  // Clicking "Я закончил(а) отвечать!" — whether during recording to
  // finish early, or automatically when time runs out — immediately
  // moves to the next question and starts its video, with no extra
  // click needed in between.
  //
  // `topic` is shown next to the Part number throughout (e.g. "Part 1 /
  // Your city"). Several questions in a row can share the same topic.
  //
  // Video files go in a `video/` folder next to index.html, named
  // video{part}-{question number}.mp4, e.g.:
  //   video/video1-1.mp4 … video/video1-8.mp4   (Part 1, 8 questions)
  //   video/video2-1.mp4                         (Part 2, 1 question)
  //   video/video3-1.mp4 … video/video3-6.mp4   (Part 3, 6 questions)
  // ===================================================================
  speaking: {
    tasks: [
      // ---- Part 1, Topic: Your city ----
      { id: 'p1q1', part: 1, topic: 'Your city', videoUrl: 'video/video1-1.mp4', speakSeconds: 45, prompt: 'What city do you live in?' },
      { id: 'p1q2', part: 1, topic: 'Your city', videoUrl: 'video/video1-2.mp4', speakSeconds: 45, prompt: 'What do you like most about your city?' },
      { id: 'p1q3', part: 1, topic: 'Your city', videoUrl: 'video/video1-3.mp4', speakSeconds: 45, prompt: 'Has your city changed much in recent years?' },
      { id: 'p1q4', part: 1, topic: 'Your city', videoUrl: 'video/video1-4.mp4', speakSeconds: 45, prompt: 'Would you like to live in another city in the future?' },

      // ---- Part 1, Topic: Weekends ----
      { id: 'p1q5', part: 1, topic: 'Weekends', videoUrl: 'video/video1-5.mp4', speakSeconds: 45, prompt: 'How do you usually spend your weekends?' },
      { id: 'p1q6', part: 1, topic: 'Weekends', videoUrl: 'video/video1-6.mp4', speakSeconds: 45, prompt: 'Which is your favourite part of the weekend?' },
      { id: 'p1q7', part: 1, topic: 'Weekends', videoUrl: 'video/video1-7.mp4', speakSeconds: 45, prompt: 'Do you think your weekends are long enough?' },
      { id: 'p1q8', part: 1, topic: 'Weekends', videoUrl: 'video/video1-8.mp4', speakSeconds: 45, prompt: 'How important do you think it is to have free time at the weekends?' },

      // ---- Part 2: cue card — 1 minute prep, then 2 minutes speaking ----
      {
        id: 'p2q1',
        part: 2,
        topic: 'Someone you know who does something well',
        videoUrl: 'video/video2-1.mp4',
        prepSeconds: 60,
        speakSeconds: 120,
        prompt: `Describe someone you know who does something well.\n\nYou should say:\n— who this person is\n— how you know this person\n— what they do well\nand explain why you think this person is so good at doing this.\n\nYou will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say. You can make some notes to help you if you wish.`
      },

      // ---- Part 3, Topic: Skills and abilities ----
      { id: 'p3q1', part: 3, topic: 'Skills and abilities', videoUrl: 'video/video3-1.mp4', speakSeconds: 60, prompt: 'What skills and abilities do people most want to have today?' },
      { id: 'p3q2', part: 3, topic: 'Skills and abilities', videoUrl: 'video/video3-2.mp4', speakSeconds: 60, prompt: 'Which skills should children learn at school, and which skills at home?' },
      { id: 'p3q3', part: 3, topic: 'Skills and abilities', videoUrl: 'video/video3-3.mp4', speakSeconds: 60, prompt: 'Which skills do you think will be important in the future?' },

      // ---- Part 3, Topic: Salaries for skilled people ----
      { id: 'p3q4', part: 3, topic: 'Salaries for skilled people', videoUrl: 'video/video3-4.mp4', speakSeconds: 60, prompt: 'Which kinds of jobs have the highest salaries in your country?' },
      { id: 'p3q5', part: 3, topic: 'Salaries for skilled people', videoUrl: 'video/video3-5.mp4', speakSeconds: 60, prompt: 'Are there any other jobs that you think should have high salaries?' },
      { id: 'p3q6', part: 3, topic: 'Salaries for skilled people', videoUrl: 'video/video3-6.mp4', speakSeconds: 60, prompt: 'Some people say it would be better for society if everyone got the same salary. What do you think about that?' }
    ]
  }
};

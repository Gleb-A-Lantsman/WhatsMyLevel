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
  // AUDIO CHECK — plays once before the test starts, on the audio
  // check screen. Drop the converted file at this path (alongside the
  // Listening audio) — same folder, same naming convention.
  // ===================================================================
  audioCheck: {
    audioUrl: 'audio/audio-check.mp3'
  },

  // ===================================================================
  // READING — 25 minutes, 3 tasks
  // ===================================================================
  reading: {
    durationSeconds: 25 * 60,
    tasks: [

      // --- Task 1: matching task (Passage A / Passage B / Both) ------
      {
        id: 'r1',
        type: 'match3',
        instructions: 'Read both passages and the 6 statements. Decide if each statement is supported by:',
        instructionList: ['Passage A', 'Passage B', 'Both Passages'],
        passages: [
          {
            label: 'Passage A',
            title: 'The Edinburgh Fringe Festival',
            text: `The Edinburgh Fringe Festival is the largest arts festival in the world. It takes place in the Scottish capital every August and lasts for three weeks. The festival began in 1947, when eight theatre companies performed shows outside the official Edinburgh International Festival without an invitation. Today, thousands of performers from comedy, theatre, dance and music take part, and most shows require a ticket. Visitors can also enjoy free street performances in the city centre, as well as food stalls selling everything from haggis rolls to international snacks.`
          },
          {
            label: 'Passage B',
            title: 'The Avignon Festival',
            text: `The Avignon Festival is one of France's most important celebrations of theatre and performance. It is held each July in the historic city of Avignon and runs for around three weeks. The festival was founded in 1947 by the director Jean Vilar, who wanted to bring high-quality theatre to a wider audience outside Paris. The main programme takes place in grand historic venues, including the Palace of the Popes, and most performances require tickets bought in advance. Alongside the official festival, an open, unticketed Fringe programme fills the streets and courtyards with independent shows, and local cafés serve traditional Provençal dishes to visitors throughout the run.`
          }
        ],
        options: ['Passage A', 'Passage B', 'Both Passages'],
        questions: [
          { id: 'r1q1', text: 'The passage explains how the festival began.', answer: 'Both Passages' },
          { id: 'r1q2', text: 'The passage says how long the festival lasts.', answer: 'Both Passages' },
          { id: 'r1q3', text: 'The passage suggests what is available to eat at the festival.', answer: 'Both Passages' },
          { id: 'r1q4', text: 'The passage says that people have to pay to attend some performances.', answer: 'Both Passages' },
          { id: 'r1q5', text: 'The passage describes a building used as a festival venue.', answer: 'Passage B' },
          { id: 'r1q6', text: 'The passage explains where the festival takes place.', answer: 'Both Passages' }
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
            title: 'Birch Lake Lodge',
            text: `Looking for a quiet escape close to nature? Birch Lake Lodge is a small countryside hotel with just 40 rooms, many overlooking the lake. The lodge sits on the edge of a national park, so guests can borrow kayaks and bicycles included in the room price. Guided forest walks are also free, though horseback riding costs extra.

There's plenty to do beyond the water. A small climbing wall stands next to the lodge's indoor pool, and a games room offers table tennis and board games. The nearest town is just 4 miles away, with a weekly farmers' market. For those who prefer to stay close, the lodge can arrange a sunset boat trip on the lake.

Breakfast is served in the main hall every morning, included in the room rate. For dinner, the lodge restaurant focuses on locally grown vegetables and fish caught from the lake that day. Meals are reasonably priced and well reviewed, though the menu is fairly limited for vegetarians.

Three evenings a week, a local folk musician performs by the fireplace, and the lodge occasionally runs beginner woodworking workshops for guests. Past visitors often mention the workshops as a highlight of their stay.

This lodge does not offer transport from the nearest airport.`
          }
        ],
        questions: [
          { id: 'r2q1', text: 'This passage is most likely from', options: ['a travel brochure.', 'an email about a vacation.', 'a guidebook to national parks.', 'a review of lodge restaurants.'], answer: 0 },
          { id: 'r2q2', text: 'What is the main purpose of the passage?', options: ['To compare Birch Lake Lodge to other hotels nearby', 'To describe what Birch Lake Lodge offers its guests', 'To report on what past guests think of Birch Lake Lodge', 'To present what the author thinks is best about Birch Lake Lodge'], answer: 1 },
          { id: 'r2q3', text: 'Which of the following is a feature at Birch Lake Lodge?', options: ['A climbing wall', 'A spa', 'A cinema', 'A golf course'], answer: 0 },
          { id: 'r2q4', text: 'According to the passage, the lodge restaurant is', options: ['over-priced.', 'cheap.', 'poor quality.', 'reasonably priced.'], answer: 3 },
          { id: 'r2q5', text: 'What must guests at Birch Lake Lodge pay extra for?', options: ['Kayaking', 'Bicycles', 'Forest walks', 'Horseback riding'], answer: 3 },
          { id: 'r2q6', text: 'Which of the following is a favorite experience of many Birch Lake Lodge guests?', options: ['Going to the climbing wall', 'The woodworking workshops', 'Visiting the farmers\' market', 'Taking a boat trip'], answer: 1 },
          { id: 'r2q7', text: 'Which description best fits Birch Lake Lodge?', options: ['A place designed to make families with young children comfortable', 'A quiet countryside retreat with outdoor activities', 'A hotel especially suited to people who love nightlife', 'A trip for those who enjoy shopping'], answer: 1 },
          { id: 'r2q8', text: 'Which of the facts does the passage tell you about Birch Lake Lodge?', options: ['The number of rooms in the lodge', 'The language the staff speak', 'The country where it is located', 'The distance from the lodge to the airport'], answer: 0 }
        ]
      },

      // --- Task 3: email passage, 10 questions -------------------------
      {
        id: 'r3',
        type: 'single4',
        instructions: 'Read the email about a farewell party and choose the best answer for each question. There are 10 questions.',
        passages: [
          {
            label: null,
            title: null,
            text: `Dear everyone,

Thank you all so much for organizing my farewell party at the office last night! It really was a wonderful surprise. James, thank you for baking that incredible chocolate cake — everyone wanted the recipe. And thanks to Priya for putting together the photo slideshow; I didn't expect to laugh and cry at the same time!

I'm so grateful for the gifts too. The scarf is beautiful, and the colour is exactly my style. The bracelet is stunning as well — I'll wear it at my new job on Monday. I think my sister will love it when she visits next month.

Oh, and Marcus — you left your umbrella at my desk. Don't worry, I'll bring it to your house this weekend, before I move out of the city on Friday.

Thank you again, everyone. I'll miss you all so much.

With love,
Daniela`
          }
        ],
        questions: [
          { id: 'r3q1', text: 'Where was Daniela\'s party held?', options: ['At a restaurant', 'At the office', 'At a park', 'At Daniela\'s flat'], answer: 1 },
          { id: 'r3q2', text: 'Who baked the cake?', options: ['James', 'Priya', 'Marcus', 'Daniela\'s sister'], answer: 0 },
          { id: 'r3q3', text: 'Who made the photo slideshow?', options: ['James', 'Priya', 'Marcus', 'Daniela'], answer: 1 },
          { id: 'r3q4', text: 'Which present will Daniela wear at her new job?', options: ['A scarf', 'A bracelet', 'A necklace', 'A watch'], answer: 1 },
          { id: 'r3q5', text: 'Who will see the bracelet next month?', options: ['James', 'Priya', 'Marcus', 'Daniela\'s sister'], answer: 3 },
          { id: 'r3q6', text: 'Why did Daniela mention Marcus in the email?', options: ['To thank him for a gift', 'To ask him to bring something back', 'To tell him she has his umbrella', 'To invite him to her new job'], answer: 2 },
          { id: 'r3q7', text: 'What does Daniela plan to do this weekend?', options: ['Bake a cake', 'Return Marcus\'s umbrella', 'Buy a scarf', 'Start her new job'], answer: 1 },
          { id: 'r3q8', text: 'When does Daniela start her new job?', options: ['Today', 'This weekend', 'Monday', 'Friday'], answer: 2 },
          { id: 'r3q9', text: 'When is Daniela moving out of the city?', options: ['Today', 'This weekend', 'Monday', 'Friday'], answer: 3 },
          { id: 'r3q10', text: 'What is Daniela\'s email mainly about?', options: ['Thanking people for organizing her party', 'Thanking people for her new job', 'Thanking people for visiting her', 'Thanking people for lending equipment'], answer: 0 }
        ]
      }
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
  //
  // The speaker lines below are your own recorded transcript. The
  // multiple-choice options are original — written to fit your audio,
  // not copied from anywhere — so feel free to edit any of them.
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
          { id: 'l1q1', speaker: 1, line: 'Where are my keys?', options: ['They\'re on the table.', 'I\'ll call you later.', 'It\'s almost five.', 'She\'s not home yet.'], answer: 0 },
          { id: 'l1q2', speaker: 2, line: 'I\'ve got a cold.', options: ['I hope you feel better soon.', 'That sounds delicious.', 'I\'ll see you at six.', 'Where did you buy it?'], answer: 0 },
          { id: 'l1q3', speaker: 3, line: 'Can you make lunch today?', options: ['Sure, what would you like?', 'It\'s down the hall.', 'Yes, I\'ll bring my umbrella.', 'No, it\'s too late.'], answer: 0 },
          { id: 'l1q4', speaker: 4, line: 'She isn\'t here yet.', options: ['Do you know when she\'ll arrive?', 'I already finished it.', 'That\'s a great idea.', 'It was very cold yesterday.'], answer: 0 },
          { id: 'l1q5', speaker: 5, line: 'What does he do?', options: ['He\'s a teacher.', 'He lives nearby.', 'He left an hour ago.', 'He\'s quite tall.'], answer: 0 },
          { id: 'l1q6', speaker: 6, line: 'They\'ve just moved house.', options: ['Oh really? Where to?', 'I\'ll pick it up tomorrow.', 'That\'s much too expensive.', 'She studied law.'], answer: 0 },
          { id: 'l1q7', speaker: 7, line: 'I\'m going to bed.', options: ['Good night, sleep well.', 'What time does it start?', 'I\'ll have the soup.', 'He\'s still at work.'], answer: 0 },
          { id: 'l1q8', speaker: 8, line: 'Can I borrow a pen?', options: ['Sure, here you go.', 'I lent it to you yesterday.', 'It\'s on sale this week.', 'I prefer tea.'], answer: 0 },
          { id: 'l1q9', speaker: 9, line: 'Could that be the dog you saw last week?', options: ['Yes, I think it is.', 'I bought it yesterday.', 'We left at noon.', 'It\'s going to rain.'], answer: 0 },
          { id: 'l1q10', speaker: 10, line: 'How much will it be to send this parcel to the USA?', options: ['That depends on the weight.', 'It arrived this morning.', 'I\'ll wrap it now.', 'He\'s travelling there next month.'], answer: 0 }
        ]
      },
      {
        id: 'l2',
        audioUrl: 'audio/listening-2.mp3',
        instructions: 'You will hear ten speakers. Each speaker will make a statement or ask a question. For each speaker, choose the best option for what comes next. You can play the recording {{TWO}} times.',
        headerStyle: 'full',
        questions: [
          { id: 'l2q1', speaker: 1, line: 'Do you like playing football?', options: ['Yes, I play every weekend.', 'He works downtown.', 'It starts at noon.', 'She prefers tennis.'], answer: 0 },
          { id: 'l2q2', speaker: 2, line: 'Where do you work?', options: ['I work at a hospital.', 'I leave at eight.', 'She\'s my sister.', 'It was very busy.'], answer: 0 },
          { id: 'l2q3', speaker: 3, line: 'I have a cold.', options: ['I\'m sorry to hear that.', 'That sounds like fun.', 'I\'ll meet you there.', 'It\'s quite spacious.'], answer: 0 },
          { id: 'l2q4', speaker: 4, line: 'I try to take a walk every day.', options: ['That\'s a great habit to have.', 'He missed the bus.', 'It\'s on the corner.', 'She bought a new car.'], answer: 0 },
          { id: 'l2q5', speaker: 5, line: 'Here is my Aunt Emily now.', options: ['It\'s lovely to finally meet you.', 'I\'ll call her tomorrow.', 'He left it at home.', 'That sounds expensive.'], answer: 0 },
          { id: 'l2q6', speaker: 6, line: 'Why did Michael turn down that job offer?', options: ['He wanted to stay closer to home.', 'He started last Monday.', 'It pays quite well.', 'She recommended him.'], answer: 0 },
          { id: 'l2q7', speaker: 7, line: 'Can you break down that process so I can understand it better?', options: ['Sure, let me go through it step by step.', 'It happened very quickly.', 'He\'s an excellent cook.', 'We finished it last year.'], answer: 0 },
          { id: 'l2q8', speaker: 8, line: 'That professor really knows how to get a point across to students.', options: ['Yes, his lectures are always clear.', 'He\'s often late to class.', 'She studies biology.', 'It\'s a difficult subject.'], answer: 0 },
          { id: 'l2q9', speaker: 9, line: 'Sally let the team down when she skipped the practice.', options: ['I know, everyone was disappointed.', 'She\'s the fastest runner.', 'It starts next week.', 'He coaches the team.'], answer: 0 },
          { id: 'l2q10', speaker: 10, line: 'If she were here, I know she would advise us to just put up with the delays.', options: ['You\'re probably right, she\'s always so patient.', 'She left two hours ago.', 'It\'s scheduled for next week.', 'He prefers a different approach.'], answer: 0 }
        ]
      },
      {
        id: 'l3',
        audioUrl: 'audio/listening-3.mp3',
        instructions: 'You will hear ten speakers. Each speaker will make a statement or ask a question. For each speaker, choose the best option for what comes next. You can play the recording {{TWO}} times.',
        headerStyle: 'short', // just "Speaker N"
        questions: [
          { id: 'l3q1', speaker: 1, line: 'I finished my book yesterday.', options: ['What did you think of it?', 'I\'ll read it tonight.', 'She\'s in the library.'], answer: 0 },
          { id: 'l3q2', speaker: 2, line: 'I live in Australia.', options: ['Oh, which city?', 'I visited last year.', 'He\'s moving there soon.'], answer: 0 },
          { id: 'l3q3', speaker: 3, line: 'Would you like a cup of tea?', options: ['Yes please, that would be lovely.', 'I prefer to walk.', 'She made it herself.'], answer: 0 },
          { id: 'l3q4', speaker: 4, line: 'This is my new Irish wool sweater.', options: ['It looks really warm.', 'I bought mine in town.', 'He doesn\'t like wool.'], answer: 0 },
          { id: 'l3q5', speaker: 5, line: 'What time is it?', options: ['It\'s almost noon.', 'It\'s down the street.', 'I\'ll be there soon.'], answer: 0 },
          { id: 'l3q6', speaker: 6, line: 'I\'m going to play pool.', options: ['Have fun, who are you playing with?', 'I\'ll bring snacks.', 'She finished her homework.'], answer: 0 },
          { id: 'l3q7', speaker: 7, line: 'This class is not very interesting.', options: ['I know, I can barely stay awake.', 'It starts at nine.', 'He teaches three classes.'], answer: 0 },
          { id: 'l3q8', speaker: 8, line: 'Shall we buy some jewellery for Mum?', options: ['That\'s a lovely idea.', 'She prefers flowers instead.', 'He already bought a gift.'], answer: 0 },
          { id: 'l3q9', speaker: 9, line: 'I am so happy that I\'m finally here.', options: ['Welcome, we\'ve been looking forward to this.', 'It took a long time to arrive.', 'She left early this morning.'], answer: 0 },
          { id: 'l3q10', speaker: 10, line: 'Who looks after the children?', options: ['Their grandmother does, most days.', 'They go to school nearby.', 'He works from home.'], answer: 0 }
        ]
      }
    ]
  },

  // ===================================================================
  // SPEAKING — matches the real IELTS Speaking format: each question
  // plays a video automatically, then a 5-second countdown, then (Part 2
  // only) a 1-minute prep, then recording starts automatically.
  //
  // Drop your converted video files into a `video/` folder next to
  // index.html, named:
  //   video/speaking-1.mp4
  //   video/speaking-2.mp4
  // ===================================================================
  speaking: {
    tasks: [
      {
        id: 's1',
        part: 1,
        videoUrl: 'video/speaking-1.mp4',
        prepSeconds: 60,   // unused for Part 1 — prep only applies to Part 2
        speakSeconds: 120,
        prompt: `Let me ask you about your home town or city.\n\n— What kind of place is it?\n— What do you like most about it?\n— What kinds of jobs do the people in your town/city do?\n— Would you say it's a good place to live? (Why?)`
      },
      {
        id: 's2',
        part: 2,
        videoUrl: 'video/speaking-2.mp4',
        prepSeconds: 60,
        speakSeconds: 120,
        prompt: `Describe a skill you would like to learn in the future.\n\nYou should say:\n— what the skill is\n— when you want to learn it\n— how you will learn it\n— and explain why you want to learn this skill`
      }
    ]
  }
};

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';

import { createClient } from '@supabase/supabase-js'
import { start } from 'repl';
const supabaseUrl = 'https://xyvimpsezgjhqbsvglyu.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body } = req;

  if (method === 'POST') {
    try {
      let startingWord = body.startingWord;
      let score = body.score;
      let age = body.age;


      // Append score to file
      // const filePath = './public/scores.txt'; // Adjust file path as needed
      // await fs.appendFile(filePath, `${startingWord} ${age} ${score}\n`);
      const { data, error } = await supabase
      .from('scores')
      .insert([
        { age: age,
          score: score,
          startingWord: startingWord },
      ])
      .select();

      // You can send a success response here
      res.status(200).json({ message: 'Score saved successfully!' });

    } catch (error) {
      console.error('Error saving score:', error);
      res.status(500).json({ message: 'Failed to save score' });
    }
  } else {
    // Handle other methods (optional)
    res.status(405).json({ message: 'Method not allowed' });
  }
}

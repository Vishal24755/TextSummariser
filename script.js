document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('textInput');
  const summaryLength = document.getElementById('summaryLength');
  const btnSummarize = document.getElementById('btnSummarize');
  const btnSample = document.getElementById('btnSample');
  const btnClear = document.getElementById('btnClear');
  const btnCopy = document.getElementById('btnCopy');
  const toast = document.getElementById('toast');

  const resultsSection = document.getElementById('resultsSection');
  const origWordCount = document.getElementById('origWordCount');
  const summaryWordCount = document.getElementById('summaryWordCount');
  const reductionPercent = document.getElementById('reductionPercent');
  const summaryText = document.getElementById('summaryText');
  const origTextDisplay = document.getElementById('origTextDisplay');

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.background = isError ? '#991b1b' : '#065f46';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2500);
  }

  // Simple Extractive Summarization Algorithm
  function generateSummary() {
    const rawText = textInput.value.trim();
    if (!rawText) {
      showToast('Please enter text to summarize.', true);
      resultsSection.style.display = 'none';
      return;
    }

    // Split into sentences using punctuation boundaries
    const sentenceMatches = rawText.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [];
    const sentences = sentenceMatches.map(s => s.trim()).filter(s => s.length > 5);

    if (sentences.length <= 1) {
      showToast('Please enter at least 2 or 3 sentences to generate an extractive summary.', true);
      return;
    }

    // Stop words
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'of', 'for', 'to', 'with', 'by',
      'as', 'from', 'that', 'this', 'it', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
      'can', 'could', 'would', 'should', 'will', 'do', 'does', 'did', 'not', 'but', 'if', 'so'
    ]);

    // Word frequencies
    const words = rawText.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
    const wordFreq = {};
    let maxFreq = 1;

    words.forEach(w => {
      if (!stopWords.has(w) && w.length > 2) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
        if (wordFreq[w] > maxFreq) maxFreq = wordFreq[w];
      }
    });

    // Score sentences
    const scoredSentences = sentences.map((sentence, idx) => {
      const sentenceWords = sentence.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
      let score = 0;
      sentenceWords.forEach(w => {
        if (wordFreq[w]) score += (wordFreq[w] / maxFreq);
      });
      // Normalized score by sentence length
      const normalizedScore = sentenceWords.length > 0 ? score / Math.sqrt(sentenceWords.length) : 0;
      return {
        idx,
        sentence,
        score: normalizedScore
      };
    });

    // Determine target sentence count
    const lenChoice = summaryLength.value;
    let targetK = 3;
    if (lenChoice === '2') targetK = 2;
    else if (lenChoice === '3') targetK = 3;
    else if (lenChoice === '0.3') targetK = Math.max(1, Math.round(sentences.length * 0.3));
    else if (lenChoice === '0.5') targetK = Math.max(1, Math.round(sentences.length * 0.5));

    targetK = Math.min(targetK, sentences.length);

    // Pick top scoring sentences
    const topScored = [...scoredSentences]
      .sort((a, b) => b.score - a.score)
      .slice(0, targetK);

    // Sort by original chronological order to preserve flow
    topScored.sort((a, b) => a.idx - b.idx);

    const summary = topScored.map(item => item.sentence).join(' ');

    // Metrics
    const origCount = words.length;
    const summaryWords = summary.match(/\b[a-z0-9]+\b/g) || [];
    const sumCount = summaryWords.length;
    const reduction = origCount > 0 ? Math.round(((origCount - sumCount) / origCount) * 100) : 0;

    origWordCount.textContent = origCount.toLocaleString();
    summaryWordCount.textContent = sumCount.toLocaleString();
    reductionPercent.textContent = `${Math.max(0, reduction)}%`;
    summaryText.textContent = summary;
    origTextDisplay.textContent = rawText;

    resultsSection.style.display = 'block';
    showToast(`Summary generated (${reduction}% size reduction).`);
  }

  btnSummarize.addEventListener('click', generateSummary);

  btnClear.addEventListener('click', () => {
    textInput.value = '';
    resultsSection.style.display = 'none';
    showToast('Input cleared.');
  });

  btnCopy.addEventListener('click', () => {
    if (!summaryText.textContent.trim()) return;
    navigator.clipboard.writeText(summaryText.textContent)
      .then(() => showToast('Summary copied to clipboard!'))
      .catch(() => showToast('Failed to copy.'));
  });

  btnSample.addEventListener('click', () => {
    textInput.value = `Artificial intelligence and computational linguistics have transformed how humans process large volumes of written text. Modern automated text summarization algorithms fall into two main categories: extractive and abstractive summarization. Extractive summarization identifies and extracts the most statistically important sentences directly from the original document based on keyword frequency and sentence placement. Abstractive summarization, on the other hand, paraphrases and generates entirely new sentences using complex deep learning language models. In business, education, and research, extractive summarization tools help analysts digest news articles, research papers, and reports quickly without losing key insights. By preserving the original chronological structure of the selected sentences, the resulting summaries remain coherent and informative for readers.`;
    generateSummary();
  });
});

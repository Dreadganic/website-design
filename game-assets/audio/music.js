/* Beju Farm music: one four-channel Game Boy-style theme per farm, synthesised live (no audio files).
   Music.init(audioContext) once (share the sound-effects context), then Music.play('mogiana'), Music.setNight(true),
   Music.setVolume(0.5), Music.setEnabled(false), Music.duck() under a big sound effect, Music.pause()/resume(). */
const Music = (function () {
'use strict';
/* ================= the songs =================
   Grid: one step is a 16th note. 4/4 bars have 16 steps, 6/8 bars have 12.
   Lead tokens are NOTE:steps ("-" rests). Chords drive the arpeggio and bass patterns. */
const SONGS = [
  { id: 'main', farm: 'Main theme', title: 'Finca Morning', blurb: 'Game Boy town theme · F major',
    about: 'The calm home theme for menus and the first farm, written like the gentle town tunes of the early Game Boy RPGs: a simple whistled melody, broken chords and a walking bass.',
    parts: ['Melody on a 50% square', 'Broken-chord arpeggios', 'Walking bass', 'Soft brushes on the off-beats'],
    bpm: 92, beat: 4, bar: 16, lead: { duty: 0.5, decay: 4, floor: 0.55, vib: 14, gain: 0.16 }, arp: { style: 'broken', duty: 0.25, gain: 0.075 }, bass: { style: 'walk', gain: 0.2 }, noise: { style: 'brush', gain: 0.05 },
    sections: {
      intro: { name: 'Intro', chords: [['F'], ['C7']], lead: ['-:16', '-:12 C5:2 D5:2'] },
      A: { name: 'A', chords: [['F'], ['Dm'], ['Bb'], ['C'], ['F'], ['Am'], ['Bb', 'C'], ['F']],
        lead: ['C5:4 A4:2 C5:2 F5:6 E5:2', 'D5:4 C5:2 A4:2 D5:8', 'D5:4 F5:2 D5:2 Bb4:4 C5:2 D5:2', 'C5:6 Bb4:2 A4:2 G4:2 E4:4', 'C5:4 A4:2 C5:2 F5:4 G5:2 A5:2', 'G5:4 E5:2 C5:2 E5:4 D5:2 C5:2', 'D5:4 Bb4:4 C5:2 E5:2 G5:4', 'F5:12 -:4'] },
      A2: { name: 'A′', chords: [['F'], ['Dm'], ['Gm'], ['C'], ['Am'], ['Dm'], ['Gm', 'C'], ['F']],
        lead: ['A5:4 G5:2 F5:2 C5:6 A4:2', 'D5:4 E5:2 F5:2 A5:8', 'G5:4 F5:2 D5:2 Bb4:4 D5:4', 'C5:2 D5:2 E5:4 G5:6 -:2', 'E5:4 C5:2 A4:2 C5:4 E5:4', 'F5:4 E5:2 D5:2 A4:8', 'Bb4:4 D5:4 C5:2 Bb4:2 G4:4', 'F4:8 A4:4 C5:4'] },
      B: { name: 'B', chords: [['Bb'], ['C'], ['Am'], ['Dm'], ['Gm'], ['C'], ['Bb'], ['C7']],
        lead: ['D5:8 F5:4 D5:4', 'E5:8 C5:4 G4:4', 'C5:6 E5:2 A5:8', 'F5:6 E5:2 D5:8', 'Bb5:6 A5:2 G5:4 D5:4', 'E5:6 F5:2 G5:8', 'F5:4 D5:4 Bb4:4 D5:4', 'C5:4 E5:4 G5:4 Bb5:4'] }
    }, form: ['intro', 'A', 'A2', 'B', 'A'] },

  { id: 'mogiana', farm: 'Mogiana, Brazil', title: 'Café com Leite', blurb: 'Bossa nova · C major',
    about: 'São Paulo’s coffee country meets Rio’s bossa nova: lazy syncopated chords with sevenths and ninths, the bossa bass that rocks between the root and the fifth below, a soft shaker and a breathy, flute-like tune.',
    parts: ['Flute-like lead with slow vibrato', 'Guitar-style chord stabs in the bossa rhythm', 'Root and low fifth, the bossa bass', 'Shaker and rim clicks'],
    bpm: 112, beat: 4, bar: 16, lead: { duty: 0.5, decay: 6, floor: 0.6, vib: 12, vibRate: 4.6, gain: 0.15 }, arp: { style: 'bossa', duty: 0.25, gain: 0.06 }, bass: { style: 'bossa', gain: 0.2 }, noise: { style: 'bossa', gain: 0.045 },
    sections: {
      intro: { name: 'Intro', chords: [['Cmaj7'], ['G7']], lead: ['-:16', '-:12 C5:2 D5:2'] },
      A: { name: 'A', chords: [['Cmaj7'], ['Cmaj7'], ['Dm7'], ['G7'], ['Em7'], ['A7'], ['Dm7'], ['G7']],
        lead: ['E5:6 D5:2 E5:4 G5:4', 'B4:10 -:2 A4:2 B4:2', 'C5:6 A4:2 F5:4 E5:2 D5:2', 'D5:10 -:2 B4:2 D5:2', 'G5:6 E5:2 B4:4 D5:4', 'C#5:10 -:2 E5:2 G5:2', 'F5:6 E5:2 D5:4 A4:4', 'B4:6 C5:2 D5:4 F5:4'] },
      B: { name: 'B', chords: [['Fmaj7'], ['Fm6'], ['Em7'], ['A7'], ['Dm7'], ['G7'], ['Cmaj7'], ['G7']],
        lead: ['E5:6 C5:2 A4:4 C5:4', 'D5:6 C5:2 Ab4:8', 'G5:6 E5:2 B4:4 D5:4', 'C#5:6 E5:2 A5:8', 'A5:6 F5:2 D5:4 C5:4', 'B4:6 D5:2 F5:4 A5:4', 'G5:8 E5:4 D5:4', 'B4:4 D5:4 G5:4 F5:4'] },
      A2: { name: 'A′', chords: [['Cmaj7'], ['Cmaj7'], ['Dm7'], ['G7'], ['Em7'], ['A7'], ['Dm7', 'G7'], ['Cmaj7']],
        lead: ['E5:4 G5:2 E5:2 D5:4 C5:4', 'B4:10 -:2 A4:2 B4:2', 'C5:6 A4:2 F5:4 E5:2 D5:2', 'D5:10 -:2 B4:2 D5:2', 'G5:6 E5:2 B4:4 D5:4', 'C#5:10 -:2 E5:2 G5:2', 'F5:4 D5:4 B4:4 D5:4', 'C5:12 -:4'] }
    }, form: ['intro', 'A', 'B', 'A2'] },

  { id: 'huila', farm: 'Huila, Colombia', title: 'Cumbia del Huila', blurb: 'Cumbia · A minor',
    about: 'Colombian cumbia slowed to a stroll: an accordion-style lead with a wobbly double reed, piano-like chord chops on the off-beats, the swaying cumbia bass and the scratch of a güiro on every beat.',
    parts: ['Accordion: two squares slightly out of tune', 'Off-beat chord chops', 'Cumbia bass on one and three', 'Güiro scrapes, long-short-short'],
    bpm: 88, beat: 4, bar: 16, lead: { duty: 0.25, decay: 8, floor: 0.7, vib: 8, vibRate: 6.2, chorus: 9, gain: 0.13 }, arp: { style: 'cumbia', duty: 0.5, gain: 0.05 }, bass: { style: 'cumbia', gain: 0.2 }, noise: { style: 'cumbia', gain: 0.05 },
    sections: {
      intro: { name: 'Intro', chords: [['Am'], ['E7']], lead: ['-:16', '-:12 B4:2 D5:2'] },
      A: { name: 'A', chords: [['Am'], ['Dm'], ['G'], ['C'], ['F'], ['Dm'], ['E7'], ['Am']],
        lead: ['E5:2 E5:2 A5:4 G5:2 E5:2 C5:4', 'D5:2 F5:2 A5:4 G5:2 F5:2 D5:4', 'B4:2 D5:2 G5:4 F5:2 D5:2 B4:4', 'C5:2 E5:2 G5:6 -:2 E5:2 G5:2', 'A5:4 G5:2 F5:2 E5:4 D5:2 C5:2', 'D5:4 F5:2 A5:2 G5:4 F5:2 E5:2', 'G#5:4 B5:2 G#5:2 E5:4 D5:2 B4:2', 'A4:6 -:2 C5:2 E5:2 A5:4'] },
      B: { name: 'B', chords: [['C'], ['G'], ['Am'], ['Em'], ['F'], ['C'], ['Dm', 'E7'], ['Am']],
        lead: ['G5:6 E5:2 C5:4 E5:4', 'D5:6 B4:2 G4:4 B4:4', 'C5:2 E5:2 A5:6 G5:2 E5:4', 'B4:2 E5:2 G5:6 F#5:2 E5:4', 'A5:2 C6:2 A5:4 F5:4 C5:4', 'E5:2 G5:2 E5:4 C5:4 G4:4', 'F5:4 E5:2 D5:2 E5:4 G#5:4', 'A5:8 E5:4 C5:4'] }
    }, form: ['intro', 'A', 'B'] },

  { id: 'gedeo', farm: 'Gedeo, Ethiopia', title: 'Yirgacheffe Dawn', blurb: 'Tizita mode · 6/8',
    about: 'Built on tizita, the wistful five-note Ethiopian mode, in the rolling 6/8 of highland songs. The lead plucks like a krar lyre with a little bend into each note, over a krar ostinato and a kebero drum pattern.',
    parts: ['Krar-style pluck with a bend into each note', 'Repeating krar ostinato', 'Rolling 6/8 bass', 'Kebero drum, claps and shaker'],
    bpm: 64, beat: 6, bar: 12, lead: { duty: 0.25, decay: 2, floor: 0.25, vib: 18, vibRate: 5.5, bend: 70, gain: 0.17 }, arp: { style: 'six', duty: 0.25, gain: 0.055 }, bass: { style: 'six', gain: 0.19 }, noise: { style: 'kebero', gain: 0.05 },
    sections: {
      intro: { name: 'Intro', chords: [['D'], ['D']], lead: ['-:12', '-:6 A4:2 D5:2 E5:2'] },
      A: { name: 'A', chords: [['D'], ['D'], ['Bm'], ['Bm'], ['D'], ['A5'], ['Bm'], ['D']],
        lead: ['F#5:4 E5:2 D5:4 E5:2', 'F#5:2 A5:2 B5:2 A5:6', 'F#5:4 E5:2 D5:2 B4:4', 'D5:2 E5:2 F#5:2 E5:6', 'A5:4 B5:2 A5:2 F#5:4', 'E5:4 F#5:2 E5:2 A4:4', 'B4:2 D5:2 E5:2 F#5:2 E5:2 D5:2', 'D5:9 -:3'] },
      B: { name: 'B', chords: [['Bm'], ['A5'], ['D'], ['D'], ['Bm'], ['E5'], ['A5'], ['D']],
        lead: ['B5:6 A5:4 F#5:2', 'E5:6 F#5:2 A5:4', 'D6:4 B5:2 A5:2 F#5:4', 'A5:9 -:3', 'F#5:4 A5:2 B5:4 A5:2', 'E5:6 B4:2 E5:4', 'E5:2 F#5:2 A5:2 E5:2 F#5:2 E5:2', 'D5:12'] }
    }, form: ['intro', 'A', 'B', 'A'] },

  { id: 'toba', farm: 'Lake Toba, Sumatra', title: 'Danau Toba', blurb: 'Batak folk ballad · D pentatonic',
    about: 'Evening on the lake. The Batak people around Lake Toba are known for slow, singing folk ballads, accompanied by the hasapi, a small two-string boat lute. A soft suling bamboo flute carries the tune over a gently plucked hasapi pattern, with a low gong marking every two bars and just a whisper of percussion.',
    parts: ['Suling-style bamboo flute', 'Plucked hasapi lute pattern', 'Low gong every two bars', 'A soft shaker and the odd kendang tap'],
    bpm: 66, beat: 4, bar: 16, lead: { duty: 0.5, decay: 8, floor: 0.65, vib: 10, vibRate: 4.5, gain: 0.13 }, arp: { style: 'hasapi', duty: 0.25, decay: 2, floor: 0.2, gain: 0.06 }, bass: { style: 'lake', gain: 0.17 }, noise: { style: 'lake', gain: 0.03 },
    sections: {
      intro: { name: 'Intro', chords: [['D'], ['A']], lead: ['-:16', '-:8 A4:4 B4:4'] },
      A: { name: 'A', chords: [['D'], ['Bm'], ['G'], ['A'], ['D'], ['Bm'], ['G', 'A'], ['D']],
        lead: ['D5:6 E5:2 F#5:8', 'B4:4 D5:4 F#5:4 E5:4', 'D5:6 B4:2 A4:8', 'A4:4 B4:2 D5:2 E5:8', 'F#5:6 A5:2 B5:4 A5:4', 'F#5:4 E5:4 D5:4 B4:4', 'B4:4 D5:4 E5:4 F#5:2 E5:2', 'D5:12 -:4'] },
      B: { name: 'B', chords: [['G'], ['D'], ['Bm'], ['A'], ['G'], ['D'], ['Em'], ['A']],
        lead: ['B5:8 A5:4 F#5:4', 'A5:8 F#5:4 D5:4', 'F#5:6 E5:2 D5:4 B4:4', 'E5:12 -:4', 'D5:4 E5:4 B5:6 A5:2', 'F#5:8 E5:4 D5:4', 'E5:4 F#5:2 E5:2 B4:4 D5:4', 'E5:8 D5:4 A4:4'] }
    }, form: ['intro', 'A', 'B', 'A'] },

  { id: 'bluemtn', farm: 'Blue Mountains, Jamaica', title: 'Mento in the Mist', blurb: 'Mento lullaby · F major',
    about: 'Early morning on the terraces, before the fog lifts. Mento is Jamaica\'s own country music, older than ska and reggae: a banjo or a fife sings over guitar chops on the off-beat, a rhumba box thumbs the bass and a shaker keeps time. Here a breathy melodica, the sound of Jamaican music from the hills to the studio, carries a slow, sing-song tune.',
    parts: ['Melodica lead, breathy and a little wobbly', 'Guitar chops on every off-beat', 'A soft rhumba-box bass', 'A brushed shaker'],
    bpm: 74, beat: 4, bar: 16, lead: { duty: 0.25, decay: 7, floor: 0.68, vib: 7, vibRate: 5.2, chorus: 6, gain: 0.13 }, arp: { style: 'cumbia', duty: 0.5, gain: 0.045 }, bass: { style: 'lake', gain: 0.18 }, noise: { style: 'lake', gain: 0.03 },
    sections: {
      intro: { name: 'Intro', chords: [['F'], ['C7']], lead: ['-:16', '-:8 C5:4 D5:4'] },
      A: { name: 'A', chords: [['F'], ['Bb'], ['F'], ['C7'], ['F'], ['Bb'], ['C7'], ['F']],
        lead: ['F5:4 A5:2 F5:2 C5:8', 'D5:4 F5:2 D5:2 Bb4:8', 'A4:2 C5:2 F5:4 E5:2 D5:2 C5:4', 'E5:4 G5:4 E5:2 D5:2 C5:4', 'F5:4 A5:2 C6:2 A5:8', 'Bb5:4 A5:2 G5:2 F5:4 D5:4', 'C5:4 E5:2 G5:2 Bb5:4 E5:4', 'F5:12 -:4'] },
      B: { name: 'B', chords: [['Bb'], ['F'], ['Gm'], ['C7'], ['Bb'], ['F'], ['Gm', 'C7'], ['F']],
        lead: ['D5:6 F5:2 Bb5:8', 'A5:4 F5:2 A5:2 C6:8', 'Bb5:4 G5:2 Bb5:2 D5:8', 'C5:4 E5:4 G5:6 -:2', 'F5:2 G5:2 Bb5:4 A5:2 G5:2 F5:4', 'A5:6 F5:2 C5:8', 'D5:4 Bb4:4 E5:4 G5:4', 'F5:8 C5:4 A4:4'] }
    }, form: ['intro', 'A', 'B', 'A'] },

  { id: 'kona', farm: 'Kona Ridge, Hawaiʻi', title: 'Kona Moon', blurb: 'Slack-key lullaby · G major',
    about: 'Late afternoon on the ridge. Hawaiian slack-key guitar is tuned open and played gently, the strings let ring; here a sliding steel guitar sings the tune over a soft ukulele strum, with the hollow knock of an ipu gourd drum and the swish of a shaker, unhurried and a little swung.',
    parts: ['Sliding steel guitar lead', 'Ukulele strum, down and up', 'Ipu gourd drum and a soft shaker', 'Warm pad and a round bass'],
    bpm: 80, beat: 4, bar: 16, lead: { duty: 0.5, decay: 6, floor: 0.6, vib: 8, vibRate: 5, gain: 0.13 }, arp: { style: 'hasapi', duty: 0.25, decay: 2, floor: 0.2, gain: 0.06 }, bass: { style: 'lake', gain: 0.17 }, noise: { style: 'lake', gain: 0.03 },
    sections: {
      intro: { name: 'Intro', chords: [['G'], ['D7']], lead: ['-:16', '-:8 D5:4 E5:4'] },
      A: { name: 'A', chords: [['G'], ['C'], ['G'], ['D'], ['G'], ['C'], ['D7'], ['G']],
        lead: ['D5:4 B4:2 D5:2 E5:8', 'E5:4 G5:4 E5:2 D5:2 C5:4', 'B4:6 A4:2 G4:8', 'A4:4 B4:2 D5:2 A4:8', 'D5:4 B4:2 D5:2 G5:8', 'E5:4 D5:2 C5:2 E5:4 G5:4', 'F#5:4 E5:2 D5:2 C5:4 A4:4', 'G4:12 -:4'] },
      B: { name: 'B', chords: [['C'], ['G'], ['Em'], ['D'], ['C'], ['G'], ['Am', 'D7'], ['G']],
        lead: ['E5:6 G5:2 A5:8', 'G5:4 E5:2 D5:2 B4:8', 'B4:4 D5:4 G5:4 E5:4', 'F#5:8 D5:4 -:4', 'E5:4 G5:4 A5:4 G5:4', 'D5:6 B4:2 G4:8', 'A4:4 C5:4 D5:4 F#5:4', 'G5:12 -:4'] }
    }, form: ['intro', 'A', 'B', 'A'] },

  { id: 'turrialba', farm: 'Turrialba, Costa Rica', title: 'Marimba del Volcán', blurb: 'Guanacaste marimba · 6/8 and 3/4',
    about: 'The marimba is Costa Rica’s national instrument, and Guanacaste music sways between 6/8 and 3/4, a feel called sesquiáltera. Long notes shimmer with marimba tremolo rolls, and the bass flips between the two metres from bar to bar.',
    parts: ['Marimba lead with tremolo rolls', 'Lower marimba ostinato', 'Bass that alternates 6/8 and 3/4', 'Shaker and rim on the shifting beats'],
    bpm: 72, beat: 6, bar: 12, lead: { duty: 0.25, decay: 1, floor: 0.2, roll: true, ping: 0.35, gain: 0.15 }, arp: { style: 'six', duty: 0.5, decay: 1, floor: 0.2, gain: 0.05 }, bass: { style: 'sesqui', gain: 0.19 }, noise: { style: 'marimba', gain: 0.04 },
    sections: {
      intro: { name: 'Intro', chords: [['G'], ['D7']], lead: ['-:12', '-:6 G4:2 B4:2 D5:2'] },
      A: { name: 'A', chords: [['G'], ['D7'], ['G'], ['C'], ['G'], ['D7'], ['C', 'D7'], ['G']],
        lead: ['B4:2 D5:2 G5:2 B5:4 A5:2', 'A5:2 F#5:2 D5:2 C5:4 A4:2', 'B4:2 D5:2 G5:2 D5:2 B4:2 G4:2', 'E5:6 G5:6', 'D5:2 G5:2 B5:2 D6:4 B5:2', 'C6:2 A5:2 F#5:2 D5:4 C5:2', 'E5:4 C5:4 F#5:4', 'G5:12'] },
      B: { name: 'B', chords: [['C'], ['G'], ['D7'], ['G'], ['Em'], ['C'], ['D7'], ['G']],
        lead: ['G5:4 E5:4 C5:4', 'D5:4 B4:4 G4:4', 'F#5:2 A5:2 C6:2 A5:2 F#5:2 D5:2', 'B5:6 G5:6', 'E5:2 G5:2 B5:2 E6:4 B5:2', 'C6:2 B5:2 A5:2 G5:2 E5:2 C5:2', 'D5:4 F#5:4 A5:4', 'G5:6 D5:2 B4:2 G4:2'] }
    }, form: ['intro', 'A', 'B', 'A'] },

  { id: 'osaka', farm: 'Osaka garden', title: 'Bushidō Roastery', blurb: 'Samurai epic · D minor',
    about: 'Written in the spirit of the big samurai film scores: a breathy shakuhachi bamboo flute that bends into its notes and sways with a slow, wide vibrato, swelling string chords underneath, and deep taiko drums that roll into each new phrase. Noble and a little melancholy, slow enough to tend the garden to.',
    parts: ['Shakuhachi: breath, slow bends, wide vibrato', 'Swelling string chords', 'Low drone on the root', 'Taiko drums with rolls and rim hits'],
    bpm: 60, beat: 4, bar: 16, lead: { duty: 0.5, decay: 10, floor: 0.7, vib: 24, vibRate: 4.2, vibDelay: 0.5, bend: 110, bendTime: 0.16, swell: 0.12, breath: 0.35, gain: 0.14 },
    arp: { style: 'pad', duty: 0.25, swell: 0.9, gain: 0.05 }, bass: { style: 'drone', gain: 0.17 }, noise: { style: 'taiko', gain: 0.06 },
    sections: {
      intro: { name: 'Intro', chords: [['Dm'], ['Dm']], lead: ['-:16', '-:12 A4:4'] },
      A: { name: 'A', chords: [['Dm'], ['Bb'], ['F'], ['C'], ['Dm'], ['Bb'], ['Gm'], ['A']],
        lead: ['D5:12 E5:2 F5:2', 'F5:8 E5:4 D5:4', 'C5:12 A4:4', 'G4:4 A4:4 C5:8', 'D5:8 F5:4 A5:4', 'G5:8 F5:4 D5:4', 'Bb4:6 C5:2 D5:4 G5:4', 'E5:12 C#5:4'] },
      B: { name: 'B', chords: [['Bb'], ['F'], ['C'], ['Dm'], ['Bb'], ['F'], ['Gm'], ['A']],
        lead: ['F5:4 G5:4 A5:8', 'C6:8 A5:4 F5:4', 'G5:12 E5:4', 'F5:6 E5:2 D5:8', 'D5:4 F5:4 Bb5:8', 'A5:6 G5:2 F5:4 C5:4', 'D5:4 G5:4 F5:4 E5:4', 'A4:8 C#5:4 E5:4'] }
    }, form: ['intro', 'A', 'B', 'A'] },

  { id: 'roastery', farm: 'Roastery, Osaka', title: 'Kissaten Blue', blurb: 'Kissaten jazz · F major',
    about: 'For the roastery: the slow jazz of an Osaka kissaten after closing, with a vibraphone melody, warm Rhodes chords, a walking upright bass, brushes and a little vinyl crackle, all on a lazy swing.',
    parts: ['Vibraphone melody with motor tremolo', 'Rhodes shell chords', 'Walking upright bass', 'Brushes, ride and vinyl crackle'],
    bpm: 84, beat: 4, bar: 16, lead: { duty: 0.5, decay: 6, floor: 0.5, vib: 8, gain: 0.14 }, arp: { style: 'broken', duty: 0.25, gain: 0.06 }, bass: { style: 'walk', gain: 0.19 }, noise: { style: 'brush', gain: 0.05 },
    sections: {
      intro: { name: 'Intro', chords: [['Fmaj7'], ['Dm7'], ['Gm7'], ['C7']], lead: ['-:16', '-:16', '-:16', '-:8 C5:2 D5:2 E5:4'] },
      A: { name: 'A', chords: [['Gm7', 'C7'], ['Fmaj7'], ['Dm7', 'G7'], ['Gm7', 'C7'], ['Am7', 'D7'], ['Gm7', 'C7'], ['Fmaj7', 'D7'], ['Gm7', 'C7']],
        lead: ['A4:2 C5:2 F5:4 E5:2 D5:2 C5:4', 'A4:6 G4:2 A4:8', 'F5:2 E5:2 D5:4 B4:4 G4:4', 'Bb4:6 A4:2 G4:4 E4:4', 'C5:2 E5:2 G5:4 F#5:4 D5:4', 'F5:6 E5:2 D5:4 Bb4:4', 'A4:8 F#4:4 A4:4', 'G4:4 A4:2 Bb4:2 C5:4 E5:4'] },
      B: { name: 'B', chords: [['Bbmaj7'], ['Bbm6'], ['Am7'], ['D7'], ['Gm7'], ['C7'], ['Fmaj7', 'Dm7'], ['Gm7', 'C7']],
        lead: ['D5:4 F5:4 A5:6 G5:2', 'F5:4 Db5:4 Bb4:8', 'C5:4 E5:4 G5:6 E5:2', 'F#5:6 E5:2 D5:4 C5:4', 'Bb4:4 D5:4 F5:4 A5:4', 'G5:6 F5:2 E5:4 C5:4', 'A5:8 F5:4 D5:4', 'G5:4 F5:2 E5:2 D5:4 C5:4'] }
    }, form: ['intro', 'A', 'B', 'A'] }
];

/* ================= score building ================= */
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) {
  const m = /^([A-G])(b|#)?(\d)$/.exec(n); if (!m) throw new Error('bad note ' + n);
  return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0);
}
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m6: [0, 3, 7, 9], '6': [0, 4, 7, 9], '5': [0, 7, 12], sus4: [0, 5, 7] };
function chord(name) {
  const m = /^([A-G])(b|#)?(.*)$/.exec(name); let r = NOTE[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0);
  r = ((r % 12) + 12) % 12; let root = 48 + r; if (root < 55) root += 12;
  const iv = QUAL[m[3]]; if (!iv) throw new Error('bad chord ' + name);
  const tones = iv.map((i) => root + i); while (tones.length < 4) tones.push(tones[tones.length - 3] + 12);
  let low = (root % 12) + 36; if (low < 43) low += 12;
  return { root, tones, low, fifth: low + 7, fifthLow: low - 5 >= 36 ? low - 5 : low + 7, oct: low + 12 };
}

function buildScore(song) {
  const ev = { lead: [], arp: [], bass: [], noise: [] }, marks = [], B = song.bar;
  let step = 0, barNo = 0;
  song.form.forEach((key, si) => {
    const sec = song.sections[key];
    marks.push({ step, si, name: sec.name });
    sec.chords.forEach((bar, b) => {
      const t0 = step + b * B, intro = key === 'intro';
      let p = t0;
      sec.lead[b].split(' ').forEach((tok) => { const [n, d] = tok.split(':'); if (n !== '-') ev.lead.push({ s: p, d: +d, m: midi(n) }); p += +d; });
      if (p - t0 !== B) throw new Error(song.id + ' ' + key + ' bar ' + (b + 1) + ' has ' + (p - t0) + ' steps');
      const part = B / bar.length;
      bar.forEach((name, ci) => {
        const c = chord(name), s0 = t0 + ci * part, whole = bar.length === 1;
        ARP[song.arp.style](ev.arp, c, s0, part, whole, barNo);
        if (!(intro && b === 0)) BASS[song.bass.style](ev.bass, c, s0, part, whole, barNo);
      });
      NOISE[song.noise.style](ev.noise, t0, B, barNo, intro && b === 0, intro);
      barNo += 1;
    });
    step += sec.chords.length * B;
  });
  const loopStep = marks[1].step;
  const by = {};
  Object.keys(ev).forEach((ch) => ev[ch].forEach((e) => { (by[e.s] = by[e.s] || []).push([ch, e]); }));
  const range = {};
  ['lead', 'arp', 'bass'].forEach((ch) => { const ms = ev[ch].flatMap((e) => e.ms || [e.m]); range[ch] = [Math.min(...ms) - 1, Math.max(...ms) + 1]; });
  return { ev, marks, total: step, loopStep, by, range };
}
const push = (list, s, d, m, extra) => list.push(Object.assign({ s, d, m }, extra || {}));
const ARP = {
  broken(o, c, s0, part, whole) { const pat = part === 16 ? [0, 1, 2, 3, 2, 1, 2, 1] : part === 12 ? [0, 1, 2, 3, 2, 1] : part === 8 ? [0, 1, 2, 1] : [0, 1, 2]; pat.forEach((k, i) => push(o, s0 + i * 2, 2, c.tones[k])); },
  bossa(o, c, s0, part) { const hits = part === 16 ? [0, 3, 6, 10, 12] : [0, 3, 6]; hits.forEach((h) => o.push({ s: s0 + h, d: 2, ms: c.tones.slice(1, 4).map((t) => t + 12) })); },
  cumbia(o, c, s0, part) { for (let h = 2; h < part; h += 4) o.push({ s: s0 + h, d: 1, ms: c.tones.slice(0, 3).map((t) => t + 12) }); },
  six(o, c, s0, part) { const pat = part === 12 ? [0, 2, 1, 2, 3, 2] : [0, 2, 1]; pat.forEach((k, i) => push(o, s0 + i * 2, 2, c.tones[k])); },
  hasapi(o, c, s0, part) { const pat = part === 16 ? [0, 2, 3, 2, 1, 2, 3, 2] : [0, 2, 3, 2]; pat.forEach((k, i) => push(o, s0 + i * 2, 2, c.tones[k] + 12)); },
  pad(o, c, s0, part) { o.push({ s: s0, d: part, ms: c.tones.slice(0, 3) }); },
};
const BASS = {
  walk(o, c, s0, part) { const bp = part === 16 ? [[c.low, 3], [0, 1], [c.low, 2], [c.fifth, 2], [c.oct, 3], [0, 1], [c.fifth, 2], [c.low, 2]] : [[c.low, 3], [0, 1], [c.fifth, 2], [c.low, 2]]; let q = s0; bp.forEach(([m, d]) => { if (m) push(o, q, d, m); q += d; }); },
  bossa(o, c, s0, part) { const bp = part === 16 ? [[c.low, 6], [c.fifthLow, 2], [c.fifthLow, 6], [c.low, 2]] : [[c.low, 6], [c.fifthLow, 2]]; let q = s0; bp.forEach(([m, d]) => { push(o, q, d, m); q += d; }); },
  cumbia(o, c, s0, part) { const bp = part === 16 ? [[c.low, 3], [0, 3], [c.low, 2], [c.fifth, 4], [c.fifth, 2], [c.low, 2]] : [[c.low, 4], [c.fifth, 4]]; let q = s0; bp.forEach(([m, d]) => { if (m) push(o, q, d, m); q += d; }); },
  six(o, c, s0, part) { const bp = part === 12 ? [[c.low, 3], [0, 1], [c.low, 2], [c.fifth, 3], [0, 1], [c.low, 2]] : [[c.low, 4], [c.fifth, 2]]; let q = s0; bp.forEach(([m, d]) => { if (m) push(o, q, d, m); q += d; }); },
  sesqui(o, c, s0, part, whole, bar) { const bp = part !== 12 ? [[c.low, 4], [c.fifth, 2]] : bar % 2 ? [[c.low, 4], [c.fifth, 4], [c.oct, 4]] : [[c.low, 6], [c.fifth, 6]]; let q = s0; bp.forEach(([m, d]) => { push(o, q, d, m); q += d; }); },
  lake(o, c, s0, part, whole, bar) { if (s0 % 16 !== 0) return; if (bar % 2 === 0) push(o, s0, 32, 38, { gong: true }); else push(o, s0 + 8, 8, c.low, { gong: true }); },
  drone(o, c, s0, part) { push(o, s0, part, c.low); }
};
const N = (o, s, kind, d, amp) => o.push({ s, d: d || 1, kind, amp: amp || 1 });
const NOISE = {
  brush(o, t0, B, bar, silent, intro) { if (silent) return; [2, 6, 10, 14].forEach((k) => N(o, t0 + k, 'hat')); if (!intro) [4, 12].forEach((k) => N(o, t0 + k, 'snare', 2)); },
  bossa(o, t0, B, bar, silent) { if (silent) return; for (let k = 0; k < 16; k += 2) N(o, t0 + k, 'shaker'); (bar % 2 ? [0, 10] : [6, 12]).forEach((k) => N(o, t0 + k, 'rim')); },
  cumbia(o, t0, B, bar, silent) { if (silent) return; for (let k = 0; k < 16; k += 4) { N(o, t0 + k, 'scrape', 2); N(o, t0 + k + 2, 'hat'); N(o, t0 + k + 3, 'hat'); } },
  kebero(o, t0, B, bar, silent) { if (silent) return; [0, 6].forEach((k) => N(o, t0 + k, 'tom', 2)); [3, 9].forEach((k) => N(o, t0 + k, 'rim')); [2, 5, 8, 11].forEach((k) => N(o, t0 + k, 'shaker')); },
  marimba(o, t0, B, bar, silent) { if (silent) return; for (let k = 0; k < 12; k += 2) N(o, t0 + k, 'shaker'); (bar % 2 ? [0, 4, 8] : [0, 6]).forEach((k) => N(o, t0 + k, 'rim')); },
  lake(o, t0, B, bar, silent) { if (silent) return; [4, 12].forEach((k) => N(o, t0 + k, 'shaker')); if (bar % 2 === 1) N(o, t0 + 14, 'tom', 2); },
  taiko(o, t0, B, bar, silent, intro) {
    if (silent) { N(o, t0, 'taiko', 4); N(o, t0 + 8, 'taiko', 4, 0.7); return; }
    N(o, t0, 'taiko', 4);
    if (intro || bar % 4 === 3) { for (let k = 8; k < 16; k++) N(o, t0 + k, 'taikoS', 1, 0.35 + (k - 8) * 0.09); return; }   /* roll into the next phrase */
    [12, 14].forEach((k) => N(o, t0 + k, 'taikoS', 2, 0.8));
    if (bar % 2) N(o, t0 + 8, 'rim', 1, 1.4);
  },
};
SONGS.forEach((s) => { s.score = buildScore(s); });

/* ================= Game Boy-ish voices ================= */
let ac = null, master, filter, waves = {}, noiseBuf = {}, night = false, song = SONGS[0], volume = 0.5, enabled = true;
const muted = { lead: false, arp: false, bass: false, noise: false };
function pulseWave(duty) { const n = 48, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); return ac.createPeriodicWave(re, im); }
function tableWave(table) {   /* 32 four-bit samples, like the wave channel's RAM */
  const L = table.length, n = 16, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) for (let i = 0; i < L; i++) { const v = table[i] / 7.5 - 1, a = 2 * Math.PI * k * i / L; re[k] += v * Math.cos(a) * 2 / L; im[k] += v * Math.sin(a) * 2 / L; }
  return ac.createPeriodicWave(re, im);
}
function lfsrNoise(short) {   /* the noise channel's shift register: 15-bit hiss or 7-bit metallic */
  const len = ac.sampleRate, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  let reg = 0x7fff, acc = 0; const rate = 32768 / ac.sampleRate * 8;
  for (let i = 0; i < len; i++) { acc += rate; while (acc >= 1) { acc -= 1; const bit = (reg ^ (reg >> 1)) & 1; reg = (reg >> 1) | (bit << 14); if (short) reg = (reg & ~0x40) | (bit << 6); } d[i] = (reg & 1) ? -0.6 : 0.6; }
  return buf;
}
function setup(ctx) {
  ac = ctx;
  master = ac.createGain(); master.gain.value = 0; filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = 0.3;
  master.connect(filter); filter.connect(ac.destination);
  waves[0.5] = pulseWave(0.5); waves[0.25] = pulseWave(0.25); waves[0.125] = pulseWave(0.125);
  waves.bass = tableWave([0, 2, 4, 6, 8, 10, 12, 13, 14, 15, 15, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0]);
  waves.gong = tableWave([8, 11, 13, 15, 15, 14, 12, 9, 7, 6, 6, 7, 9, 10, 10, 9, 7, 5, 3, 2, 2, 3, 5, 6, 6, 5, 3, 1, 0, 0, 2, 5]);
  noiseBuf.long = lfsrNoise(false); noiseBuf.short = lfsrNoise(true);
  applyMix();
}
const bpm = () => song.bpm * (night ? 0.84 : 1);
const sixteenth = () => 60 / bpm() / song.beat;
function applyMix() { if (!ac) return; filter.frequency.setTargetAtTime(night ? 2600 : 6500, ac.currentTime, 0.3); master.gain.setTargetAtTime(enabled && playing ? volume : 0, ac.currentTime, 0.08); }
function stepEnv(g, t, vol, len, decaySteps, floor) {   /* volume falls in 1/15 steps every n/64 s, then releases */
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004);
  let v = vol, tt = t + 0.004; const dec = vol / 15;
  while (decaySteps && v - dec >= vol * floor && tt + decaySteps / 64 < t + len) { tt += decaySteps / 64; v -= dec; g.gain.setValueAtTime(v, tt); }
  g.gain.setValueAtTime(v, Math.max(tt, t + len - 0.012)); g.gain.linearRampToValueAtTime(0, Math.max(tt, t + len - 0.012) + 0.012);
}
function swellEnv(g, t, vol, len, attack) {   /* slow bowed or blown entry instead of a pluck */
  const a = Math.min(attack, len * 0.5);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, Math.max(t + a, t + len - 0.08)); g.gain.linearRampToValueAtTime(0, t + len);
}
function osc(wave, f, t, end, out, detune) { const o = ac.createOscillator(); o.setPeriodicWave(wave); o.frequency.value = f; if (detune) o.detune.value = detune; o.connect(out); o.start(t); o.stop(end + 0.03); return o; }
function chain(pan) { const g = ac.createGain(); if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master); return g; }
function playLead(e, t) {
  const L = song.lead, st = sixteenth(), len = e.d * st, vol = L.gain * (night ? 0.8 : 1), duty = night && L.duty === 0.5 ? 0.25 : L.duty;
  const strikes = L.roll && e.d >= 4 ? Array.from({ length: e.d }, (_, i) => [t + i * st, st, i === 0 ? 1 : 0.62 + (i % 2) * 0.12]) : [[t, len, 1]];
  strikes.forEach(([ts, ls, amp]) => {
    const g = chain(0.15), o = osc(waves[duty], hz(e.m), ts, ts + ls, g);
    if (L.swell) swellEnv(g, ts, vol * amp, ls - 0.01, L.swell); else stepEnv(g, ts, vol * amp, ls - 0.008, L.decay, L.floor);
    if (L.breath && amp === 1) { const gb = chain(0.15), nb = ac.createBufferSource(); nb.buffer = noiseBuf.long; nb.playbackRate.value = 1.4; nb.connect(gb); stepEnv(gb, ts, vol * L.breath, 0.12, 1, 0); nb.start(ts, Math.random() * 0.5); nb.stop(ts + 0.14); }
    if (L.chorus) { const g2 = chain(0.15); osc(waves[duty], hz(e.m), ts, ts + ls, g2, L.chorus); stepEnv(g2, ts, vol * amp * 0.6, ls - 0.008, L.decay, L.floor); }
    if (L.ping) { const g3 = chain(0.15); osc(waves[0.5], hz(e.m) * 2, ts, ts + 0.12, g3); stepEnv(g3, ts, vol * amp * L.ping, 0.12, 1, 0); }
    if (L.bend && amp === 1) { o.detune.setValueAtTime(-L.bend, ts); o.detune.linearRampToValueAtTime(0, ts + (L.bendTime || 0.07)); }
    if (L.vib && ls > 0.3) {
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = L.vibRate || 5.2;
      const vd = L.vibDelay || 0.22; lg.gain.setValueAtTime(0, ts); lg.gain.setValueAtTime(0, ts + vd); lg.gain.linearRampToValueAtTime(L.vib, ts + vd + 0.25);
      lfo.connect(lg); lg.connect(o.detune); lfo.start(ts); lfo.stop(ts + ls);
    }
  });
}
function playArp(e, t) {
  const A = song.arp, len = e.d * sixteenth(), g = chain(-0.25), vol = A.gain * (night ? 0.75 : 1);
  if (e.ms) {   /* a chord on one channel: cycle its notes very fast, the classic handheld trick */
    const o = osc(waves[A.duty], hz(e.ms[0]), t, t + len, g);
    for (let k = 0, tt = t; tt < t + len; k++, tt += A.swell ? 1 / 36 : 1 / 50) o.frequency.setValueAtTime(hz(e.ms[k % e.ms.length]), tt);
  } else osc(waves[A.duty], hz(e.m), t, t + len, g);
  if (A.swell) swellEnv(g, t, vol, len - 0.005, A.swell); else stepEnv(g, t, vol, len - 0.005, A.decay || 2, A.floor !== undefined ? A.floor : 0.3);
}
function playBass(e, t) {
  const len = e.d * sixteenth(), g = chain(0), vol = song.bass.gain * (night ? 0.8 : 1);
  if (e.gong) { const o = osc(waves.gong, hz(e.m), t, t + len, g); o.detune.setValueAtTime(0, t); const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 3.2; lg.gain.value = 9; lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + len); stepEnv(g, t, vol * 1.2, len, 10, 0); return; }
  osc(waves.bass, hz(e.m), t, t + len, g); stepEnv(g, t, vol, len - 0.015, 0, 1);
}
function playNoise(e, t) {
  const vol = song.noise.gain * (night ? 0.4 : 1), g = chain(0.05);
  if (e.kind === 'taiko' || e.kind === 'taikoS') {
    const big = e.kind === 'taiko', a = (e.amp || 1) * vol, len = big ? 0.6 : 0.24, o = ac.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(big ? 96 : 150, t); o.frequency.exponentialRampToValueAtTime(big ? 42 : 72, t + len * 0.8); o.connect(g); o.start(t); o.stop(t + len + 0.02);
    stepEnv(g, t, a * (big ? 3.4 : 2.2), len, big ? 3 : 1, 0);
    const gn = chain(0), nb = ac.createBufferSource(); nb.buffer = noiseBuf.long; nb.playbackRate.value = 0.3; nb.connect(gn); stepEnv(gn, t, a * (big ? 1.4 : 0.8), 0.07, 1, 0); nb.start(t, Math.random() * 0.5); nb.stop(t + 0.09);
    return;
  }
  if (e.kind === 'tom') { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(80, t + 0.14); o.connect(g); o.start(t); o.stop(t + 0.18); stepEnv(g, t, vol * 2.4, 0.16, 1, 0); return; }
  const K = { hat: [noiseBuf.short, 1.6, 0.05, 0.7], snare: [noiseBuf.long, 0.7, 0.14, 1.3], shaker: [noiseBuf.long, 2.2, 0.05, 0.55], rim: [noiseBuf.short, 0.45, 0.035, 1.1], scrape: [noiseBuf.long, 1.1, 0.16, 0.9] }[e.kind];
  if (e.kind === 'snare' && night) return;
  const src = ac.createBufferSource(); src.buffer = K[0]; src.playbackRate.value = K[1]; src.connect(g);
  if (e.kind === 'scrape') { g.gain.setValueAtTime(0, t); for (let k = 0, tt = t; tt < t + K[2]; k++, tt += 0.014) g.gain.setValueAtTime(vol * K[3] * (k % 2 ? 0.35 : 1), tt); g.gain.setValueAtTime(0, t + K[2]); }
  else stepEnv(g, t, vol * K[3] * (e.amp || 1), K[2], 1, 0);
  src.start(t, Math.random() * 0.5); src.stop(t + K[2] + 0.02);
}
const PLAY = { lead: playLead, arp: playArp, bass: playBass, noise: playNoise };
SONGS.forEach((s) => { s.score = buildScore(s); });

/* ================= scheduler ================= */
let playing = false, paused = false, step = 0, nextT = 0, timer = null, startedAt = 0, pending = null, swapT = null;
const placed = [];
function schedule() {
  const sc = song.score;
  while (nextT < ac.currentTime + 0.15) {
    (sc.by[step] || []).forEach(([ch, e]) => { if (!muted[ch]) PLAY[ch](e, nextT); });
    placed.push([nextT, step]); if (placed.length > 64) placed.shift();
    nextT += sixteenth(); step += 1;
    if (step >= sc.total) step = sc.loopStep;
  }
}
function run(from) { clearInterval(timer); step = from || 0; nextT = ac.currentTime + 0.1; startedAt = nextT; placed.length = 0; timer = setInterval(schedule, 25); schedule(); }
const byId = (id) => SONGS.find((s) => s.id === id) || SONGS[0];
function play(id) {
  if (!ac) return;
  const next = byId(id);
  if (playing && next === (pending || song)) return;
  if (playing) {   /* fade the old tune out, then start the new one from its intro */
    pending = next; clearTimeout(swapT);
    master.gain.setTargetAtTime(0, ac.currentTime, 0.12); clearInterval(timer); timer = null;
    swapT = setTimeout(() => { song = pending; pending = null; if (playing && !paused && enabled) { run(0); applyMix(); } }, 450);
    return;
  }
  song = next; playing = true;
  if (!enabled || paused) return;
  run(0); applyMix();
}
function stop() { playing = false; pending = null; clearTimeout(swapT); clearInterval(timer); timer = null; if (ac) applyMix(); }
return {
  songs: SONGS,
  util: { chord, midi, hz },
  init(ctx) { if (!ac && ctx) setup(ctx); return !!ac; },
  play, stop,
  restart() { if (ac && playing) run(0); },
  current: () => (playing ? (pending || song).id : null),
  song: () => song,
  select(id) { song = byId(id); },
  isPlaying: () => playing && !!timer,
  setNight(v) { if (night === !!v) return; night = !!v; applyMix(); },
  isNight: () => night,
  setVolume(v) { volume = v; applyMix(); },
  setEnabled(v) {
    enabled = !!v;
    if (!ac) return;
    if (!enabled) { clearInterval(timer); timer = null; } else if (playing && !paused && !timer) run(step);
    applyMix();
  },
  pause() { paused = true; if (timer) { clearInterval(timer); timer = null; } if (ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.05); },
  resume() { paused = false; if (ac && playing && enabled && !timer) { run(step); applyMix(); } },
  duck() {   /* dip under a big sound effect, then come back */
    if (!ac || !enabled || !playing) return;
    const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(volume * 0.45, t + 0.05); master.gain.setValueAtTime(volume * 0.45, t + 0.5); master.gain.linearRampToValueAtTime(volume, t + 1.1);
  },
  muted, bpm, placed,
  startedAt: () => startedAt,
  time: () => (ac ? ac.currentTime : 0),
  state: () => (ac ? ac.state : 'not started')
};
})();

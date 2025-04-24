// Canvas 2 oyunculu oyunun gelişmiş logic yapısı (sprite destekli + kale seçimi + SVG + ayak animasyonu)

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Matter, { Engine, Composite, Events, IEventCollision } from 'matter-js'
import { useRouter } from 'next/navigation'
import { useAudio } from '@/contexts/AudioContext'
import Image from 'next/image'

// Takım bilgilerini tanımla
const TEAMS = {
  '200': { name: 'Arsenal', image: '/assets/head/200.png' },
  '201': { name: 'Aston Villa', image: '/assets/head/201.png' },
  '202': { name: 'Blackburn', image: '/assets/head/202.png' },
  '203': { name: 'Bolton', image: '/assets/head/203.png' },
  '204': { name: 'Chelsea', image: '/assets/head/204.png' },
  '205': { name: 'Everton', image: '/assets/head/205.png' },
  '206': { name: 'Fulham', image: '/assets/head/206.png' },
  '207': { name: 'Liverpool', image: '/assets/head/207.png' },
  '208': { name: 'Man City', image: '/assets/head/208.png' },
  '209': { name: 'Man Utd', image: '/assets/head/209.png' },
  '210': { name: 'Newcastle', image: '/assets/head/210.png' },
  '211': { name: 'Tottenham', image: '/assets/head/211.png' }
} as const

type TeamId = keyof typeof TEAMS

interface Settings {
  player1Team: TeamId
  player2Team: TeamId
  stadium: string
  gameMode: 'golden' | 'timed' | 'first7'
}

export default function TwoPlayerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const { isMusicPlaying, areSfxMuted, toggleBackgroundMusic, toggleSoundEffects, playSfx } = useAudio()
  const playSfxRef = useRef(playSfx)
  const keysRef = useRef<Record<string, boolean>>({
    'w': false,
    's': false,
    'a': false,
    'd': false,
    'ArrowUp': false,
    'ArrowDown': false,
    'ArrowLeft': false,
    'ArrowRight': false,
    ' ': false,
    'p': false
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [player1Team, setPlayer1Team] = useState<TeamId>('200')
  const [player2Team, setPlayer2Team] = useState<TeamId>('201')
  const [player1Head, setPlayer1Head] = useState<string>(TEAMS['200'].image)
  const [player2Head, setPlayer2Head] = useState<string>(TEAMS['201'].image)
  const [backgroundImage, setBackgroundImage] = useState<string>('/assets/stadium/303.svg')
  const kickAngleP1Ref = useRef(0)
  const kickAngleP2Ref = useRef(0)
  const kickPressedP1Ref = useRef(false)
  const kickPressedP2Ref = useRef(false)
  const kickStartTimeP1 = useRef<number | null>(null)
  const kickStartTimeP2 = useRef<number | null>(null)
  const sparkSizeRef = useRef(100)
  const sparkOpacityRef = useRef(1)
  const sparkVisibleRef = useRef(false)
  const sparkPositionRef = useRef({ x: 0, y: 0 })
  const scoreP1Ref = useRef(0)
  const scoreP2Ref = useRef(0)
  const jumpCountP1 = useRef(0)
  const jumpCountP2 = useRef(0)
  const engineRef = useRef<Matter.Engine | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const jumpEffectRef = useRef<{ x: number; y: number } | null>(null)
  const jumpEffectVisibleRef = useRef(false)
  const jumpEffectAngle = 45 * (Math.PI / 180)
  const jumpEffectSizeRef = useRef(60)
  const jumpEffectOpacityRef = useRef(0.6)
  const jumpEffectTimerRef = useRef<number | null>(null)
  const ballRotationRef = useRef(0)
  const [gameMode, setGameMode] = useState<'golden' | 'timed' | 'first7'>('timed')
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<'player1' | 'player2' | 'draw' | null>(null)
  const timeLeftRef = useRef(timeLeft)
  const [redirecting, setRedirecting] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const scoreBackgroundImage = useRef<HTMLImageElement | null>(null)

  // Sabit kale ayarları
  const goalSettings = {
    width: 80,
    height: 130,
    image: '/assets/goals/141.svg'
  }

  // Zamanlayıcı
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (gameMode === 'timed' && !gameOver && isInitialized) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if(timer) clearInterval(timer)
            setGameOver(true)
            
            if (scoreP1Ref.current > scoreP2Ref.current) {
              setWinner('player1')
            } else if (scoreP2Ref.current > scoreP1Ref.current) {
              setWinner('player2')
            } else {
              setWinner('draw')
            }
            
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [gameMode, gameOver, isInitialized])

  // Oyun bittiğinde ses çal ve yönlendir
  useEffect(() => {
    if (gameOver && !redirecting) {
        setRedirecting(true);
        playSfxRef.current('finish');
        const redirectTimer = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => {
            clearTimeout(redirectTimer);
        }
    }
  }, [gameOver, router, redirecting]);

  // playSfx fonksiyonu değişirse ref'i güncelle
  useEffect(() => {
    playSfxRef.current = playSfx;
  }, [playSfx]);

  // timeLeft state'i değiştiğinde ref'i güncelle
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Tam Ekran Değişikliği Dinleyicisi
  const handleFullscreenChange = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fullscreenElement = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;
    setIsFullscreen(!!fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  // Tam Ekran Aç/Kapa Fonksiyonu
  const toggleFullscreen = () => {
    if (!gameAreaRef.current) return;
    const elem = gameAreaRef.current;
    if (!isFullscreen) {
      if (elem.requestFullscreen) { elem.requestFullscreen().catch(err => console.error(`Error enabling fullscreen: ${err.message}`)); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if ((elem as any).webkitRequestFullscreen) { (elem as any).webkitRequestFullscreen(); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if ((elem as any).mozRequestFullScreen) { (elem as any).mozRequestFullScreen(); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if ((elem as any).msRequestFullscreen) { (elem as any).msRequestFullscreen(); }
    } else {
      if (document.exitFullscreen) { document.exitFullscreen().catch(err => console.error(`Error disabling fullscreen: ${err.message}`)); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if ((document as any).webkitExitFullscreen) { (document as any).webkitExitFullscreen(); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if ((document as any).mozCancelFullScreen) { (document as any).mozCancelFullScreen(); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if ((document as any).msExitFullscreen) { (document as any).msExitFullscreen(); }
    }
  };

  useEffect(() => {
    // Ayarları ve tuş dinleyicilerini yükle
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('2player-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as Settings;
        setPlayer1Team(parsedSettings.player1Team || '200');
        setPlayer2Team(parsedSettings.player2Team || '201');
        setPlayer1Head(TEAMS[parsedSettings.player1Team || '200'].image);
        setPlayer2Head(TEAMS[parsedSettings.player2Team || '201'].image);
        setGameMode(parsedSettings.gameMode || 'timed');

        switch (parsedSettings.stadium) {
          case '/assets/stadium/300.png': setBackgroundImage('/assets/stadium/303.svg'); break;
          case '/assets/stadium/301.png': setBackgroundImage('/assets/stadium/304.svg'); break;
          case '/assets/stadium/302.png': setBackgroundImage('/assets/stadium/305.svg'); break;
        }
      }
      setIsInitialized(true);
    }

    const down = (e: KeyboardEvent) => {
      if (['w', 's', 'a', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'p'].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true;
      if (e.key === ' ') {
        kickPressedP1Ref.current = true;
        kickStartTimeP1.current = Date.now();
      }
      if (e.key === 'p') {
        kickPressedP2Ref.current = true;
        kickStartTimeP2.current = Date.now();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (['w', 's', 'a', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'p'].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = false;
      if (e.key === ' ') kickPressedP1Ref.current = false;
      if (e.key === 'p') kickPressedP2Ref.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Ana Oyun Motoru ve Döngüsü
  useEffect(() => {
    if (!isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas boyutları (Artık style'dan alınıyor, ama fizik motoru için lazım)
    canvas.width = 960;
    canvas.height = 540;

    const engine = Engine.create({
      gravity: { x: 0, y: 0.5 }
    });
    engineRef.current = engine;

    // Fiziksel Cisimler
    const ground = Matter.Bodies.rectangle(480, 500, 960, 20, { isStatic: true, restitution: 0.5 });
    const leftWall = Matter.Bodies.rectangle(0, 270, 20, 540, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(960, 270, 20, 540, { isStatic: true });
    const topWall = Matter.Bodies.rectangle(480, 0, 960, 20, { isStatic: true });

    const post = 5;
    const goalY = 500 - goalSettings.height;
    const goalInwardOffset = 10;
    const goalTopAngle = 1 * (Math.PI / 180);

    const goalLeft = Matter.Bodies.rectangle(0 + goalInwardOffset + post/2, 500 - goalSettings.height/2, post, goalSettings.height, { isStatic: true });
    const goalRight = Matter.Bodies.rectangle(960 - goalInwardOffset - post/2, 500 - goalSettings.height/2, post, goalSettings.height, { isStatic: true });
    const goalLeftTop = Matter.Bodies.rectangle(0 + goalInwardOffset + goalSettings.width/5, goalY + post/2, goalSettings.width, post, { isStatic: true, angle: goalTopAngle });
    const goalRightTop = Matter.Bodies.rectangle(960 - goalInwardOffset - goalSettings.width/5, goalY + post/2, goalSettings.width, post, { isStatic: true, angle: -goalTopAngle });

    const ball = Matter.Bodies.circle(480, 100, 15, { restitution: 0.95, friction: 0.05, density: 0.3 });

    const playerRadius = 24;
    const player1 = Matter.Bodies.circle(200, 450, playerRadius, { restitution: 0.05, friction: 0.01, frictionAir: 0.1, density: 0.8 });
    const player2 = Matter.Bodies.circle(760, 450, playerRadius, { restitution: 0.05, friction: 0.01, frictionAir: 0.1, density: 0.8 });

    Composite.add(engine.world, [
      ground, leftWall, rightWall, topWall,
      goalLeft, goalRight, goalLeftTop, goalRightTop,
      ball, player1, player2
    ]);

    // Görsel Öğeler (Resimler)
    const goalImage = new window.Image(); goalImage.src = goalSettings.image;
    const shoeP1 = new window.Image(); shoeP1.src = '/assets/shoes/320.svg';
    const shoeP2 = new window.Image(); shoeP2.src = '/assets/shoes/317.svg';
    const ballImage = new window.Image(); ballImage.src = '/assets/ball.svg';
    const spark = new window.Image(); spark.src = '/assets/shapes/106.svg';
    const jumpEffect = new window.Image(); jumpEffect.src = '/assets/shapes/94.svg';
    const player1HeadImage = new window.Image(); player1HeadImage.src = player1Head;
    const player2HeadImage = new window.Image(); player2HeadImage.src = player2Head;

    // Skor arka planını yükle
    scoreBackgroundImage.current = new window.Image();
    if (scoreBackgroundImage.current) {
      scoreBackgroundImage.current.src = '/assets/score/score1.png';
    }

    // Olay Dinleyicileri
    const collisionHandler = (event: IEventCollision<Engine>) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if ((bodyA === player1 && bodyB === ground) || (bodyB === player1 && bodyA === ground)) jumpCountP1.current = 0;
        if ((bodyA === player2 && bodyB === ground) || (bodyB === player2 && bodyA === ground)) jumpCountP2.current = 0;
        const isPlayer1Collision = (bodyA === player1 && bodyB === ball) || (bodyB === player1 && bodyA === ball);
        const isPlayer2Collision = (bodyA === player2 && bodyB === ball) || (bodyB === player2 && bodyA === ball);
        if (isPlayer1Collision || isPlayer2Collision) playSfxRef.current('kick');
      });
    };
    Events.on(engine, 'collisionStart', collisionHandler);

    // Çizim Fonksiyonları
    function drawBall(body: Matter.Body) {
      if (!ctx) return;
      const pos = body.position;
      const radius = 15;
      const velocity = body.velocity;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      if (speed > 0.1) {
        const direction = velocity.x > 0 ? 1 : -1;
        ballRotationRef.current += speed * 0.05 * direction;
      }
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(ballRotationRef.current);
      ctx.drawImage(ballImage, -radius, -radius, radius * 2, radius * 2);
      ctx.restore();
    }

    function drawFoot(body: Matter.Body, image: HTMLImageElement, angle: number, isLeft: boolean): { x: number, y: number } {
      if (!ctx) return { x: 0, y: 0 };
      const pos = body.position;
      const radius = 26;
      const footRadius = 15;
      const direction = isLeft ? -1 : 1;
      const startAngle = Math.PI / 2;
      const totalAngle = startAngle + direction * angle;
      const footX = pos.x + Math.cos(totalAngle) * (radius + footRadius / 2);
      const footY = pos.y + Math.sin(totalAngle) * (radius + footRadius / 2);
      ctx.save();
      ctx.translate(footX, footY);
      ctx.rotate(totalAngle);
      if (isLeft && image.src.includes('320.svg')) ctx.scale(-1, -1);
      ctx.drawImage(image, -footRadius, -footRadius, footRadius * 2, footRadius * 2);
      ctx.restore();
      return { x: footX, y: footY };
    }

    function drawPlayerHead(body: Matter.Body, image: HTMLImageElement, teamId: TeamId) {
      if (!ctx) return;
      const pos = body.position;
      const physicalRadius = playerRadius;
      const offsetY = 0;
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, physicalRadius, 0, Math.PI * 2);
      ctx.clip();
      if (image === player2HeadImage) {
        ctx.translate(pos.x, pos.y);
        ctx.scale(-1, 1);
        ctx.translate(-pos.x, -pos.y);
      }
      const visualDiameter = physicalRadius * 2;
      ctx.drawImage(image, pos.x - physicalRadius, pos.y - physicalRadius + offsetY, visualDiameter, visualDiameter);
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(TEAMS[teamId].name, pos.x, pos.y + physicalRadius + 15);
      ctx.restore();
    }

    // Animasyon Efektleri
    function animateSpark() {
      if (sparkVisibleRef.current) {
        sparkSizeRef.current += 2;
        sparkOpacityRef.current -= 0.05;
        if (sparkOpacityRef.current <= 0) {
          sparkVisibleRef.current = false;
          sparkSizeRef.current = 30;
          sparkOpacityRef.current = 1;
        }
      }
    }
    function animateJumpEffect() {
      if (jumpEffectVisibleRef.current) {
        if (jumpEffectTimerRef.current === null) jumpEffectTimerRef.current = Date.now();
        const elapsed = Date.now() - jumpEffectTimerRef.current;
        const phaseDuration = 500;
        if (elapsed < 1000) {
          const phaseElapsed = elapsed % phaseDuration;
          if (phaseElapsed < phaseDuration / 2) {
            jumpEffectSizeRef.current = Math.min(60 + (phaseElapsed / 5), 80);
            jumpEffectOpacityRef.current = Math.max(0.6 - (phaseElapsed / 1000), 0.2);
          } else {
            jumpEffectSizeRef.current = Math.max(80 - ((phaseElapsed - phaseDuration/2) / 5), 60);
            jumpEffectOpacityRef.current = Math.min(0.2 + ((phaseElapsed - phaseDuration/2) / 1000), 0.6);
          }
        } else {
          jumpEffectVisibleRef.current = false;
          jumpEffectSizeRef.current = 60;
          jumpEffectOpacityRef.current = 0.6;
          jumpEffectTimerRef.current = null;
        }
      }
    }

    // Oyun Sonu Kontrolü
    function checkGameOver() {
      if (gameOver) return;
      if (gameMode === 'first7' && (scoreP1Ref.current >= 7 || scoreP2Ref.current >= 7)) {
        setGameOver(true);
        setWinner(scoreP1Ref.current >= 7 ? 'player1' : 'player2');
      }
      if (gameMode === 'golden' && (scoreP1Ref.current > 0 || scoreP2Ref.current > 0)) {
        setGameOver(true);
        setWinner(scoreP1Ref.current > 0 ? 'player1' : 'player2');
      }
    }

    // Ana Oyun Döngüsü
    let animationFrameId: number;
    function loop() {
      if (!ctx || !canvas || !engine) return;

      // Fizik Motorunu Güncelle
      Matter.Engine.update(engine, 1000 / 60);

      // Animasyonları Güncelle
      animateSpark();
      animateJumpEffect();

      // Ayak Açılarını Güncelle
      if (kickPressedP1Ref.current) kickAngleP1Ref.current = Math.min(kickAngleP1Ref.current + 0.15, Math.PI / 2);
      else kickAngleP1Ref.current = Math.max(kickAngleP1Ref.current - 0.3, 0);
      if (kickPressedP2Ref.current) kickAngleP2Ref.current = Math.min(kickAngleP2Ref.current + 0.15, Math.PI / 2);
      else kickAngleP2Ref.current = Math.max(kickAngleP2Ref.current - 0.3, 0);

      // Oyuncu Hareketlerini Uygula
      const speed = 5;
      // Player 1
      const angle1 = Math.atan2((keysRef.current['w'] ? -1 : 0) + (keysRef.current['s'] ? 1 : 0), (keysRef.current['d'] ? 1 : 0) + (keysRef.current['a'] ? -1 : 0));
      if (keysRef.current['w'] || keysRef.current['a'] || keysRef.current['s'] || keysRef.current['d']) Matter.Body.setVelocity(player1, { x: Math.cos(angle1) * speed, y: player1.velocity.y });
      else Matter.Body.setVelocity(player1, { x: player1.velocity.x * 0.95, y: player1.velocity.y });
      if (keysRef.current['w'] && jumpCountP1.current === 0) {
        Matter.Body.setVelocity(player1, { x: player1.velocity.x, y: -8 });
        jumpCountP1.current = 1;
        playSfxRef.current('jump');
      }
      // Player 2
      const angle2 = Math.atan2((keysRef.current['ArrowUp'] ? -1 : 0) + (keysRef.current['ArrowDown'] ? 1 : 0), (keysRef.current['ArrowRight'] ? 1 : 0) + (keysRef.current['ArrowLeft'] ? -1 : 0));
      if (keysRef.current['ArrowUp'] || keysRef.current['ArrowLeft'] || keysRef.current['ArrowDown'] || keysRef.current['ArrowRight']) Matter.Body.setVelocity(player2, { x: Math.cos(angle2) * speed, y: player2.velocity.y });
      else Matter.Body.setVelocity(player2, { x: player2.velocity.x * 0.95, y: player2.velocity.y });
      if (keysRef.current['ArrowUp'] && jumpCountP2.current === 0) {
        Matter.Body.setVelocity(player2, { x: player2.velocity.x, y: -8 });
        jumpCountP2.current = 1;
        playSfxRef.current('jump');
      }

      // --- Çizim İşlemleri ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Kaleleri Çiz
      if (goalImage.complete) {
          ctx.drawImage(goalImage, 0 + goalInwardOffset, goalY, goalSettings.width, goalSettings.height);
          ctx.save();
          ctx.translate(960 - goalInwardOffset - goalSettings.width / 2, goalY + goalSettings.height / 2);
          ctx.scale(-1, 1);
          ctx.drawImage(goalImage, -goalSettings.width / 2, -goalSettings.height / 2, goalSettings.width, goalSettings.height);
          ctx.restore();
      }

      // Topu Çiz
      drawBall(ball);

      // Oyuncuları Çiz (Kafa ve Ayak)
      drawPlayerHead(player1, player1HeadImage, player1Team);
      const footPos1 = drawFoot(player1, shoeP1, kickAngleP1Ref.current, true);
      drawPlayerHead(player2, player2HeadImage, player2Team);
      const footPos2 = drawFoot(player2, shoeP2, kickAngleP2Ref.current, false);

      // Ayak-Top Etkileşimini Kontrol Et ve Uygula
      const ballPos = ball.position;
      const ballRadius = 15;
      const footRadius = 15;
      const collisionThreshold = ballRadius + footRadius;
      // Player 1
      const dx1 = ballPos.x - footPos1.x;
      const dy1 = ballPos.y - footPos1.y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      if (dist1 < collisionThreshold) {
        if (kickPressedP1Ref.current) {
          const duration = kickStartTimeP1.current ? (Date.now() - kickStartTimeP1.current) / 1000 : 0.1;
          const force = Math.min(duration * 1250, 500);
          const impulseX = dx1 * force * 0.03125;
          const impulseY = dy1 * force * 0.03125;
          Matter.Body.setVelocity(ball, { x: Math.min(Math.max(impulseX, -12.5), 12.5), y: Math.min(Math.max(impulseY, -12.5), 12.5) });
          sparkVisibleRef.current = true;
          sparkPositionRef.current = { x: footPos1.x, y: footPos1.y };
          sparkSizeRef.current = 30;
          sparkOpacityRef.current = 1;
          playSfxRef.current('kick');
        } else {
          const normalX = dx1 / dist1;
          const normalY = dy1 / dist1;
          const nudgeForce = 0.0005;
          Matter.Body.applyForce(ball, ballPos, { x: normalX * nudgeForce, y: normalY * nudgeForce });
        }
      }
      // Player 2
      const dx2 = ballPos.x - footPos2.x;
      const dy2 = ballPos.y - footPos2.y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (dist2 < collisionThreshold) {
        if (kickPressedP2Ref.current) {
          const duration = kickStartTimeP2.current ? (Date.now() - kickStartTimeP2.current) / 1000 : 0.1;
          const force = Math.min(duration * 1250, 500);
          const impulseX = dx2 * force * 0.03125;
          const impulseY = dy2 * force * 0.03125;
          Matter.Body.setVelocity(ball, { x: Math.min(Math.max(impulseX, -12.5), 12.5), y: Math.min(Math.max(impulseY, -12.5), 12.5) });
          sparkVisibleRef.current = true;
          sparkPositionRef.current = { x: footPos2.x, y: footPos2.y };
          sparkSizeRef.current = 30;
          sparkOpacityRef.current = 1;
          playSfxRef.current('kick');
        } else {
          const normalX = dx2 / dist2;
          const normalY = dy2 / dist2;
          const nudgeForce = 0.0005;
          Matter.Body.applyForce(ball, ballPos, { x: normalX * nudgeForce, y: normalY * nudgeForce });
        }
      }

      // Efektleri Çiz
      if (sparkVisibleRef.current) {
        ctx.save();
        ctx.globalAlpha = sparkOpacityRef.current;
        ctx.drawImage(spark, sparkPositionRef.current.x - sparkSizeRef.current / 2, sparkPositionRef.current.y - sparkSizeRef.current / 2, sparkSizeRef.current, sparkSizeRef.current);
        ctx.restore();
      }
      if (jumpEffectVisibleRef.current && jumpEffectRef.current) {
        ctx.save();
        ctx.translate(jumpEffectRef.current.x, 500);
        ctx.rotate(jumpEffectAngle);
        ctx.globalAlpha = jumpEffectOpacityRef.current;
        ctx.drawImage(jumpEffect, -jumpEffectSizeRef.current/2, -jumpEffectSizeRef.current/2, jumpEffectSizeRef.current, jumpEffectSizeRef.current);
        ctx.restore();
      }

      // Gol Kontrolü
      if (ballPos.x - ballRadius < goalInwardOffset + goalSettings.width / 2 &&
          ballPos.x - ballRadius > goalInwardOffset &&
          ballPos.y > goalY) {
        playSfxRef.current('goal');
        scoreP2Ref.current += 1;
        Matter.Body.setPosition(ball, { x: 480, y: 100 }); Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        Matter.Body.setPosition(player1, { x: 200, y: 450 }); Matter.Body.setVelocity(player1, { x: 0, y: 0 });
        Matter.Body.setPosition(player2, { x: 760, y: 450 }); Matter.Body.setVelocity(player2, { x: 0, y: 0 });
      }
      if (ballPos.x + ballRadius > canvas.width - goalInwardOffset - goalSettings.width / 2 &&
          ballPos.x + ballRadius < canvas.width - goalInwardOffset &&
          ballPos.y > goalY) {
        playSfxRef.current('goal');
        scoreP1Ref.current += 1;
        Matter.Body.setPosition(ball, { x: 480, y: 100 }); Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        Matter.Body.setPosition(player1, { x: 200, y: 450 }); Matter.Body.setVelocity(player1, { x: 0, y: 0 });
        Matter.Body.setPosition(player2, { x: 760, y: 450 }); Matter.Body.setVelocity(player2, { x: 0, y: 0 });
      }

      // Skor ve Zaman Gösterimini Çiz
      const scoreBgWidth = 450
      const scoreBgHeight = 200
      const scoreBgX = (canvas.width - scoreBgWidth) / 2
      const scoreBgY = -60

      // Arka plan resmini çiz
      if (scoreBackgroundImage.current && scoreBackgroundImage.current.complete) {
          ctx.drawImage(scoreBackgroundImage.current, scoreBgX, scoreBgY, scoreBgWidth, scoreBgHeight)
      }

      // Metin ayarları
      ctx.fillStyle = 'white'
      ctx.font = 'bold 15px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const textY = scoreBgY + scoreBgHeight / 2

      // Player 1 Takım Adı (Sol)
      ctx.textAlign = 'left'
      ctx.fillText(TEAMS[player1Team].name, scoreBgX +60, textY)

      // Player 2 Takım Adı (Sağ)
      ctx.textAlign = 'right'
      ctx.fillText(TEAMS[player2Team].name, scoreBgX + scoreBgWidth - 50, textY)

      // Skor (Orta)
      ctx.textAlign = 'center'
      ctx.font = 'bold 30px Arial'
      const scoreText = `${scoreP1Ref.current} - ${scoreP2Ref.current}`
      ctx.fillText(scoreText, canvas.width / 2, textY)

      // Zamanlayıcı (Orta - Skorun altında)
      if (gameMode === 'timed' && !gameOver) {
          ctx.font = 'bold 16px Arial'
          ctx.fillText(`${timeLeftRef.current}s`, canvas.width / 2, textY + 25)
      }

      // Oyun Sonu Kontrolü ve Ekranı
      checkGameOver();
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = 'white'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        
        if (winner === 'draw') {
          ctx.fillText('DRAW!', 480, 270)
        } else {
          const winnerTeam = winner === 'player1' ? TEAMS[player1Team] : TEAMS[player2Team]
          ctx.fillText(`${winnerTeam.name} Win!`, 480, 270)
        }
      }

      // Bir sonraki frame'i iste
      if (!gameOver) {
          animationFrameId = requestAnimationFrame(loop);
      }
    }

    // Döngüyü başlat
    animationFrameId = requestAnimationFrame(loop);

    // Cleanup function
    return () => {
      console.log("Cleanup: Stopping Matter.js engine and animation frame");
      cancelAnimationFrame(animationFrameId);
      Events.off(engine, 'collisionStart', collisionHandler);
      Matter.Engine.clear(engine);
      engineRef.current = null;
      renderRef.current = null;
      scoreBackgroundImage.current = null;
    };
  }, [isInitialized, gameMode, player1Head, player2Head, backgroundImage, gameOver, goalSettings.height, goalSettings.image, goalSettings.width, jumpEffectAngle, player1Team, player2Team, winner]);

  useEffect(() => {
    if (gameOver) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameOver, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden">
      <div 
        ref={gameAreaRef} 
        className="relative bg-gray-800" 
        style={{
          width: 960, 
          height: 540,
          transform: 'scale(1.5)',
          transformOrigin: 'center center'
        }}
      >
        <canvas
          ref={canvasRef}
          className="block border border-white"
          width={960}
          height={540}
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: '110% 100%',
            backgroundPosition: 'center'
          }}
        />
        <Image
          src="/assets/tool/grass.png"
          alt="Grass Background"
          width={960}
          height={32}
          className="absolute bottom-0 left-0 w-full h-8 object-cover z-10 pointer-events-none"
        />
        <div className="absolute bottom-0 right-4 flex gap-3 z-20">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 bg-black/50 rounded-full p-1.5 hover:bg-white/70 transition-colors"
            title="Ana Menü"
          >
            <Image
              src="/assets/tool/menu.svg"
              alt="Menu"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 bg-black/50 rounded-full p-1 hover:bg-white/70 transition-colors"
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
          >
            <Image
              src={isFullscreen ? '/assets/tool/fullscreen_exit.svg' : '/assets/tool/fullscreen_enter.svg'}
              alt="Toggle Fullscreen"
              width={24}
              height={24}
              className="w-full h-full object-contain"
            />
          </button>
          <button onClick={toggleBackgroundMusic} className="w-8 h-8 bg-black/50 rounded-full p-1 hover:bg-white/70 transition-colors">
            <Image
              src={isMusicPlaying ? '/assets/tool/son.svg' : '/assets/tool/soff.svg'}
              alt="Toggle Music"
              width={24}
              height={24}
              className="w-full h-full object-contain"
            />
          </button>
          <button onClick={toggleSoundEffects} className="w-8 h-8 bg-black/50 rounded-full p-1 hover:bg-white/70 transition-colors">
            <Image
              src={areSfxMuted ? '/assets/tool/moff.svg' : '/assets/tool/mon.svg'}
              alt="Toggle SFX"
              width={24}
              height={24}
              className="w-full h-full object-contain"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

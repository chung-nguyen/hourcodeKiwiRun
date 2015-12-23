exports = function() 
{
    addBackground("backgroundSky.png");

    addBackgroundLayer("co 1", "fargroundBrush.png");
    setOpacity("co 1", 0.5);
    setPosition("co 1", 30);
    setDistance("co 1", 20);
    
    addBackgroundLayer ("co 2", "midgroundBrush.png");
    setDistance("co 2", 25);
    
    addClouds("dam may", "cloud1.png", "cloud2.png", "cloud3.png", "cloud4.png", "cloud5.png");
    setSpacing("dam may", 100);
    setPositionInRange("dam may", 50, 400);
    setDistance("dam may", 5);
    
    addBackgroundLayer("nuoc 1", "waterFast.png");
    setDistance("nuoc 1", 10);
    setOpacity("nuoc 1", 0.5);
    addBackgroundLayer("nuoc 2", "waterSlow.png");
    setDistance("nuoc 2", 5);
  
    addIsland("platform256.png", "platform512.png", "platform768.png", "platform1024.png");
    setDistanceOfIslands(7);
    setSpacingOfIslands(200);
    
    addCharacter("kiwiAce");
    setGravityOfCharacter(1400);
    setJumpStrengthOfCharacter(500);    

    addPowerUp("foodstar.png", "foodcherry.png");

    addEnemy("hamster", "bee");
    setChanceOfEnemyAppearance(50);
    
    turnScoreOn();
    turnMusicOn();
  

    
  
  
  
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
    
    
    
    
    
    
    
    
    
}
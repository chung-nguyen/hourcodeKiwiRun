exports = function() 
{
    
    themHinhNen("backgroundSky.png");
    
    themDayHinh ("cay 1", "fargroundTree1.png", "fargroundTree2.png", "fargroundTree3.png", "fargroundTree4.png");
    datDoXa("cay 1", 30);
    datViTriTrongKhoang("cay 1", 50, 100);
    doiKhoangCach("cay 1", 120);
    
    themDayHinh ("cay 2", "midgroundTree1.png", "midgroundTree2.png", "midgroundTree3.png", "midgroundTree4.png", "midgroundTree5.png", "midgroundTree6.png");
    datDoXa("cay 2", 18);
    datViTriTrongKhoang("cay 2", -50, 0);
    doiKhoangCach("cay 2", 160);

    themDayHinh("co 1", "fargroundBrush.png");
    doiDoTrongSuot("co 1", 0.5);
    datViTri("co 1", 30);
    datDoXa("co 1", 20);
    
    themDayHinh ("co 2", "midgroundBrush.png");
    datDoXa("co 2", 18);
    
    themDamMay("dam may", "cloud1.png", "cloud2.png", "cloud3.png", "cloud4.png", "cloud5.png");
    doiKhoangCach("dam may", 100);
    datViTriTrongKhoang("dam may", 50, 400);
    datDoXa("dam may", 5);
    
    themDayHinh("nuoc 1", "waterFast.png");
    datDoXa("nuoc 1", 10);
    doiDoTrongSuot("nuoc 1", 0.5);
    themDayHinh("nuoc 2", "waterSlow.png");
    datDoXa("nuoc 2", 5);
  
    themDao("platform256.png", "platform512.png", "platform768.png", "platform1024.png");
    datDoXaCuaDao(7);
    datKhoangCachDao(200);
    
    themNhanVat("avatarKiwiAce/kiwiAce");
    datTrongLucNhanVat(1400);
    datLucNhayNhanVat(500);    

    themDoAn("star.png", "cherry.png");

    themKeThu("enemies/poop", "enemies/bee");
    datXacSuatHienKeThu(50);
    
    batBangDiem();
    batNhac();

}


document.querySelector('.menu-toggle').addEventListener('click', function () {
    const nav = document.querySelector('.nav ul');
    const hamburger = document.querySelector('.menu-toggle');
    hamburger.classList.toggle('active');
    nav.classList.toggle('active');
});


// Nampilin Hamburger dan Pengaturan klik
document.addEventListener('click', function (event) {
    const nav = document.querySelector('.nav ul');
    const hamburger = document.querySelector('.menu-toggle');
    const isClickInsideNav = nav.contains(event.target);

    if (!isClickInsideNav && !hamburger.contains(event.target)) {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
    }
});



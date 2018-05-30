//(function(){
    var savedScrollPosition = 0;
    var currentPage = 0;
    var amountPerPage = 25;
    var fullStories = null;

    const _dateSort = (a,b) => {
        let _a = Number(a.time);
        let _b = Number(b.time);
        return _a-_b;
    };

    const validateEnvironment = () => {
        if (!('fetch' in window)) return false;
        return true;
    };

    const clearSingleStory = () => {
        let singleStory = document.querySelector('#singleStory .story');
        if(singleStory) {
            document.querySelector('#singleStory').removeChild(singleStory);
        }
    };

    const clearPage = () => {
        document.querySelector('#storyList').innerHTML = '';
    };

    const doError = (message) => {
        alert(message);
        throw Error(message);
    }

    const loadSingleStory = (storyid) => {
        return fetch('content/' + storyid + '.json',{
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        }).then((response) => {
            return response.json();
        }).catch((error) => { doError(error); }).then((story) => {
            clearSingleStory();

            let storyElement = document.createElement('div');
            storyElement.classList.add('story');
            let datePosted = new Date(parseFloat(story.time));

            storyElement.innerHTML = `
                <div class="row">
                    <div class="col-xs-12">
                        <div class="title">` + story.title + `</div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <span class="author detail">Author: ` + story.author + `</span>
                        <span class="detail">&nbsp;|&nbsp;</span>
                        <span class="date detail">Date: ` + datePosted.toLocaleDateString() + `</span>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <a class="link detail" target="_BLANK" href="https://np.reddit.com` + story.url + `">Original:&nbsp;` + story.url + `</a>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <button class="returnButton" type="button">Return To Story List</button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="content">` + fixURLs(story.body) + `</div>
                    </div>
                </div>
            `;
            document.querySelector('#singleStory').appendChild(storyElement);
            setHash(currentPage,story.id)
        }).then(() => {
            scrollToPosition(0);
            document.querySelector('#singleStory').classList.remove('hidden');
            document.querySelector('#storyList').classList.add('hidden');
        });
    };

    const loadPage = (pageIndex) => {
        var pageStartIndex = amountPerPage * pageIndex;
        var pageEndIndex = amountPerPage * pageIndex + amountPerPage;

        return fullStories.slice(pageStartIndex,pageEndIndex);
    };

    const getStoryIndex = () => {
        return fetch('content/index.json',{
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        }).then((response) => {
            return response.json();
        }).catch((error) => { doError(error); }).then((response) => {
            return response.stories.sort(_dateSort).reverse();
        }).then((response) => {
            fullStories = response;
        });
    };

    const fixURLs = (content) => {
        content = content.replace(/\"(https?\:)?\/\/((old|www|np)\.)?(reddit\.com\/r\/nosleep\/comments|redd\.it)\/([a-zA-Z0-9]+)(.*?)\>/gim,'"#$5">Link:&nbsp;');
        return content;
    };

    const parseHash = () => {
        return JSON.parse(atob(window.location.hash.split('#')[1]));
    };
    const encodeHash = () => {
        return btoa(JSON.stringify(window.location.hash.split('#')[1]));
    }
    const setHash = (page,story) => {
        window.location.hash = btoa(JSON.stringify({"page":parseInt(page),"story":story}));
    }

    const isHashSet = () => {
        return !(window.location.hash == "");
    };

    const buildNav = (activePage) => {
        var navigatorContainer = document.createElement('div');
        navigatorContainer.classList.add('navigation');
        var totalPages = 1;
        for(var i = 0;i <= parseInt((fullStories.length+1)/amountPerPage);++i,++totalPages) {
            navigatorContainer.innerHTML += `<div class="page` + (activePage == i ? ' active' : '') + `" data-page="` + (i) + `">` + (i + 1) + `</div>`;
        }
        document.querySelector('#storyList').appendChild(navigatorContainer);
        currentPage = activePage;
        setHash(currentPage,0)
    };

    const returnButtonHandler = (e) => {
        if(e.target && e.target.classList.contains('returnButton')) {
            document.querySelector('#singleStory').classList.add('hidden');
            document.querySelector('#storyList').classList.remove('hidden');
            setHash(currentPage,0);
            scrollToPosition(0)
        }
    };

    const singleStoryButtonHandler = (e) => {
        if(e.target && e.target.classList.contains('storyLink')) {
            savedScrollPosition = window.scrollY;
            loadSingleStory(e.target.dataset.storyid);
        }
    };

    const scrollToPosition = (y) => {
        scrollTo(0,y);
    };

    const renderStoryList = (stories) => {
        for(story of stories) {
            let storyElement = document.createElement('div');
            storyElement.classList.add('story');
            let datePosted = new Date(parseFloat(story.time));

            storyElement.innerHTML = `
                <a href="#` + story.id + `" class="storyLink" data-storyid="` + story.id + `"></a>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="title">` + story.title + `</div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <span class="author detail">Author: ` + story.author + `</span>
                        <span class="detail">&nbsp;|&nbsp;</span>
                        <span class="date detail">Date: ` + datePosted.toLocaleDateString() + `</span>
                    </div>
                </div>
            `;

            document.querySelector('#storyList').appendChild(storyElement);
        }
    };

    const paginationButtonHandler = (e) => {
        if(e.target && e.target.classList.contains('page')) {
            clearPage();
            renderStoryList(loadPage(e.target.dataset.page));
            buildNav(e.target.dataset.page);
            scrollToPosition(0);
        }
    };

    const singleStoryHashChangeHandler = () => {
        if(isHashSet() && parseHash().story != 0) {
            loadSingleStory(parseHash().story);
        }
    };

    const eventListeners = () => {
        document.addEventListener('click',singleStoryButtonHandler);
        document.addEventListener('click',returnButtonHandler);
        document.addEventListener('click',paginationButtonHandler);
        window.onhashchange = singleStoryHashChangeHandler;
    };

    if(!validateEnvironment()) {
        throw Error("Invalid environment. Try a different browser");
    }

    getStoryIndex().then((stories) => {
        if(isHashSet()) {
            parsedHash = parseHash();
            if(parsedHash.story != 0) {
                loadSingleStory(parsedHash.story);
            } else {
                renderStoryList(loadPage(parsedHash.page));
                buildNav(parsedHash.page);
            }
        } else {
            renderStoryList(loadPage(0));
            buildNav(0);
        }

        eventListeners();
        scrollToPosition(0);
    });
    
//})();
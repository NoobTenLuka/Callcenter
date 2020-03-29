﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Callcenter.Models;

namespace Callcenter.Controllers
{
    public class AlleController : Controller
    {
        private readonly ILogger<AlleController> _logger;
        private readonly DBConnection _save;
        private const int DEFAULTLIMIT  = 30;
        private const int MAXLIMIT = 100000;
        public AlleController(ILogger<AlleController> logger, DBConnection save)
        {
            _logger = logger;
            _save = save;
        }


        /// <summary>
        /// Alle Anrufe, in der Datenbank zurückgeben. Max: DefaultLimit
        /// </summary>
        /// <returns></returns>
        [HttpGet("/Alle/")]
        public IActionResult GetAllDefault()
        {
            return GetAll(0, DEFAULTLIMIT);
        }
        /// <summary>
        /// Alle Anrufe, in der Datenbank zurückgeben. beginnent bei Eintrag: Skip Max: DefaultLimit
        /// </summary>
        /// <returns></returns>
        [HttpGet("/Alle/{skip}")]
        public IActionResult GetAllDefLimit(int skip)
        {
            return GetAll(skip, DEFAULTLIMIT);
        }
        /// <summary>
        /// Alle Anrufe, in der Datenbank zurückgeben. beginnent bei Eintrag: Skip Max: limit, limit ist Limitiert auf MaxLimit
        /// </summary>
        /// <returns></returns>
        [HttpGet("/Alle/{skip}/{limit}")]
        public IActionResult GetAll(int skip, int limit)
        {
            limit = Math.Min(limit, MAXLIMIT);
            long countall =_save.CountAll();
            long nextskip = Math.Min(countall, skip + DEFAULTLIMIT);
            long NaechstenAnz = Math.Min(countall - nextskip, DEFAULTLIMIT);
            ViewData["CountAll"] = countall;
            ViewData["NaechstenAnz"] = NaechstenAnz > 0 ? NaechstenAnz.ToString() : string.Empty;
            ViewData["NaechsteSkip"] = nextskip;
            ViewData["CountNoZip"] = _save.CountNoZip();
            ViewData["CallHour"] = _save.CountCallHour();
            ViewData["EditHour"] = _save.CountEditHour();
            ViewData["CallDay"] = _save.CountCallDay();
            ViewData["EditDay"] = _save.CountEditDay();
            return View("Index", _save.GetAll(skip, limit));
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
